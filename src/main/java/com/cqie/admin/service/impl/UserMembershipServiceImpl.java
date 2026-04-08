package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.constant.MemberLevel;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.UserMembershipDO;
import com.cqie.admin.entity.UserPointsAccountDO;
import com.cqie.admin.mapper.UserMembershipMapper;
import com.cqie.admin.mapper.UserPointsAccountMapper;
import com.cqie.admin.service.UserMembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UserMembershipServiceImpl extends ServiceImpl<UserMembershipMapper, UserMembershipDO> implements UserMembershipService {

    private final UserPointsAccountMapper userPointsAccountMapper;

    /**
     * 购买会员等级
     * @param username 用户名
     * @param targetLevelCode 会员等级代码
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void buyMember(String username, int targetLevelCode) {
        if (username == null || username.trim().isEmpty()) {
            throw new ClientException("500", "用户名不能为空");
        }

        MemberLevel targetLevel;
        try {
            targetLevel = MemberLevel.fromCode(targetLevelCode);
        } catch (IllegalArgumentException ex) {
            throw new ClientException("500", "无效的会员等级");
        }
        if (targetLevel == MemberLevel.NONE) {
            throw new ClientException("500", "不可购买无会员等级");
        }

        LocalDate today = LocalDate.now();
        UserMembershipDO membership = baseMapper.selectOne(new LambdaQueryWrapper<UserMembershipDO>()
                .eq(UserMembershipDO::getUsername, username)
                .last("limit 1"));

        // 首次购买：立即生效
        if (membership == null) {
            membership = new UserMembershipDO();
            membership.setUsername(username);
            membership.setLevel(targetLevel.getCode());
            membership.setCurrentStart(today);
            membership.setCurrentEnd(today.plusMonths(1).minusDays(1));
            membership.setStatus(1);
            membership.setNextLevel(null);
            membership.setNextStart(null);
            baseMapper.insert(membership);
            resetMonthlyPoints(username, targetLevel.getMonthlyPoints());
            return;
        }

        // 如果预约已到期，先自动切到预约周期（惰性生效）
        applyPendingScheduleIfDue(membership, today);

        MemberLevel currentLevel = MemberLevel.fromCode(membership.getLevel());
        boolean inCurrentCycle = !today.isBefore(membership.getCurrentStart()) && !today.isAfter(membership.getCurrentEnd());

        if (inCurrentCycle) {
            // 当前有效周期内禁止降级
            if (!currentLevel.canUpgradeTo(targetLevel)) {
                throw new ClientException("500", "当前周期内不允许降级购买");
            }

            // 已有预约时，也禁止把预约改成更低等级（含从SVIP预约降到VIP）
            if (membership.getNextLevel() != null) {
                MemberLevel scheduledLevel = MemberLevel.fromCode(membership.getNextLevel());
                if (!scheduledLevel.canUpgradeTo(targetLevel)) {
                    throw new ClientException("500", "已预约周期不允许降级调整");
                }
            }

            // 同级或升级 -> 预约到下周期生效
            membership.setNextLevel(targetLevel.getCode());
            membership.setNextStart(membership.getCurrentEnd().plusDays(1));
            baseMapper.updateById(membership);
            return;
        }

        // 不在当前周期（已过期）：按今天开启新周期
        membership.setLevel(targetLevel.getCode());
        membership.setCurrentStart(today);
        membership.setCurrentEnd(today.plusMonths(1).minusDays(1));
        membership.setStatus(1);
        membership.setNextLevel(null);
        membership.setNextStart(null);
        baseMapper.updateById(membership);

        resetMonthlyPoints(username, targetLevel.getMonthlyPoints());
    }

    /**
     * 获取当前会员等级
     * @param username 用户名
     * @return 会员等级
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public MemberLevel getCurrentLevel(String username) {
        UserMembershipDO membership = baseMapper.selectOne(new LambdaQueryWrapper<UserMembershipDO>()
                .eq(UserMembershipDO::getUsername, username)
                .last("limit 1"));
        if (membership == null) {
            return MemberLevel.NONE;
        }

        LocalDate today = LocalDate.now();

        // 查询时也做一次惰性切换，便于测试“预约自动生效”
        applyPendingScheduleIfDue(membership, today);

        if (today.isBefore(membership.getCurrentStart()) || today.isAfter(membership.getCurrentEnd())) {
            return MemberLevel.NONE;
        }
        return MemberLevel.fromCode(membership.getLevel());
    }

    /**
     * 应用预约的会员等级
     * @param membership 会员信息
     * @param today 今天
     */
    private void applyPendingScheduleIfDue(UserMembershipDO membership, LocalDate today) {
        if (membership.getNextLevel() == null || membership.getNextStart() == null) {
            return;
        }
        if (today.isBefore(membership.getNextStart())) {
            return;
        }

        MemberLevel nextLevel = MemberLevel.fromCode(membership.getNextLevel());
        membership.setLevel(nextLevel.getCode());
        membership.setCurrentStart(membership.getNextStart());
        membership.setCurrentEnd(membership.getNextStart().plusMonths(1).minusDays(1));
        membership.setStatus(1);
        membership.setNextLevel(null);
        membership.setNextStart(null);
        baseMapper.updateById(membership);

        // 新周期生效时重置月赠积分
        resetMonthlyPoints(membership.getUsername(), nextLevel.getMonthlyPoints());
    }

    /**
     * 重置月赠积分
     * @param username 用户名
     * @param monthlyPoints 月赠积分
     */
    private void resetMonthlyPoints(String username, int monthlyPoints) {
        UserPointsAccountDO account = userPointsAccountMapper.selectById(username);
        if (account == null) {
            account = new UserPointsAccountDO();
            account.setUsername(username);
            account.setMonthlyPoints(monthlyPoints);
            account.setExtraPoints(0);
            account.setExtraExpireAt(null);
            userPointsAccountMapper.insert(account);
            return;
        }
        account.setMonthlyPoints(monthlyPoints);
        userPointsAccountMapper.updateById(account);
    }
}
