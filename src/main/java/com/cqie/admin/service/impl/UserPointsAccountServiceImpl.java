package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.constant.ExtraPackageConstant;
import com.cqie.admin.common.constant.MemberLevel;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.UserMembershipDO;
import com.cqie.admin.entity.UserPointsAccountDO;
import com.cqie.admin.mapper.UserMembershipMapper;
import com.cqie.admin.mapper.UserPointsAccountMapper;
import com.cqie.admin.service.UserPointsAccountService;
import com.cqie.admin.service.UserPointsLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserPointsAccountServiceImpl extends ServiceImpl<UserPointsAccountMapper, UserPointsAccountDO> implements UserPointsAccountService {

    private final UserMembershipMapper userMembershipMapper;

    private final UserPointsLogService userPointsLogService;

    /**
     * 消耗积分
     * @param username 用户名
     * @param seconds 秒数
     * @param quality 质量参数，可选值：std/premium
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void consumePoints(String username, int seconds, String quality) {
        if (username == null || username.trim().isEmpty()) {
            throw new ClientException("500", "用户名不能为空");
        }
        if (seconds <= 0) {
            throw new ClientException("500", "时长必须大于0秒");
        }

        int unitPricePerSecond;
        if ("premium".equalsIgnoreCase(quality)) {
            unitPricePerSecond = 30;
        } else if ("std".equalsIgnoreCase(quality)) {
            unitPricePerSecond = 25;
        } else {
            throw new ClientException("500", "质量参数不合法，仅支持 std/premium");
        }

        int needCost = seconds * unitPricePerSecond;

        UserPointsAccountDO account = baseMapper.selectById(username);
        if (account == null) {
            throw new ClientException("500", "积分账户不存在");
        }

        int monthly = account.getMonthlyPoints() == null ? 0 : account.getMonthlyPoints();
        int extra = account.getExtraPoints() == null ? 0 : account.getExtraPoints();

        // 超过加油包有效期（含3天缓冲）自动清零
        LocalDate today = LocalDate.now();
        if (account.getExtraExpireAt() != null && today.isAfter(account.getExtraExpireAt())) {
            extra = 0;
            account.setExtraPoints(0);
            account.setExtraExpireAt(null);
        }

        if (monthly + extra < needCost) {
            throw new ClientException("500", "积分不足");
        }

        // 先扣A类（月赠），后扣B类（加油包）
        int fromMonthly = Math.min(monthly, needCost);
        monthly -= fromMonthly;
        int remain = needCost - fromMonthly;
        if (remain > 0) {
            extra -= remain;
        }

        account.setMonthlyPoints(monthly);
        account.setExtraPoints(extra);
        baseMapper.updateById(account);
        userPointsLogService.updateUserPoints(username, -needCost, quality+"视频生成消耗");
    }

    /**
     * 增加加油包积分
     * @param username 用户名
     * @param points 积分
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void addExtraPoints(String username, int points) {
        if (username == null || username.trim().isEmpty()) {
            throw new ClientException("500", "用户名不能为空");
        }
        if (points <= 0) {
            throw new ClientException("500", "加油包积分必须大于0");
        }

        UserMembershipDO membership = userMembershipMapper.selectOne(new LambdaQueryWrapper<UserMembershipDO>()
                .eq(UserMembershipDO::getUsername, username)
                .last("limit 1"));
        if (membership == null) {
            throw new ClientException("500", "用户当前无会员，不能购买加油包");
        }

        LocalDate today = LocalDate.now();
        LocalDate currentEnd = membership.getCurrentEnd();
        if (currentEnd == null) {
            throw new ClientException("500", "会员数据异常");
        }

        // 会员有效期 + 3天缓冲内允许购买/恢复加油包
        if (today.isAfter(currentEnd.plusDays(ExtraPackageConstant.GRACE_DAYS))) {
            throw new ClientException("500", "会员已过缓冲期，不能购买加油包");
        }

        MemberLevel currentLevel = MemberLevel.fromCode(membership.getLevel());
        if (!currentLevel.canBuyExtraPackage()) {
            throw new ClientException("500", "仅VIP/SVIP可购买加油包");
        }

        UserPointsAccountDO account = baseMapper.selectById(username);
        if (account == null) {
            account = new UserPointsAccountDO();
            account.setUsername(username);
            account.setMonthlyPoints(0);
            account.setExtraPoints(0);
            account.setExtraExpireAt(null);
            baseMapper.insert(account);
        }

        int currentExtra = account.getExtraPoints() == null ? 0 : account.getExtraPoints();
        account.setExtraPoints(currentExtra + points);

        // 有效期始终跟随当前主会员结束日 + 3天
        account.setExtraExpireAt(currentEnd.plusDays(ExtraPackageConstant.GRACE_DAYS));

        baseMapper.updateById(account);
    }
}
