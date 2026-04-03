package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.cqie.admin.common.constant.MemberLevelEnum;
import com.cqie.admin.common.constant.PointsPackageEnum;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.service.MemberService;
import com.cqie.admin.service.UserPointsLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;

/**
 * 会员服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final UserMapper userMapper;
    private final UserPointsLogService userPointsLogService;

    /**
     * 开通会员
     * @param userId      用户ID
     * @param memberLevel 会员等级
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void openMember(Long userId, MemberLevelEnum memberLevel) {
        if (memberLevel == null || memberLevel == MemberLevelEnum.NORMAL) {
            throw new ClientException("500", "无效的会员等级");
        }

        UserDO user = userMapper.selectById(userId);
        if (user == null) {
            throw new ClientException("500", "用户不存在");
        }

        // 计算会员到期时间
        Date expireTime = calculateExpireTime(memberLevel.getValidMonths());

        // 更新用户会员信息
        user.setMemberLevel(memberLevel.getCode());
        user.setMemberExpireTime(expireTime);

        // 增加积分
        int currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        int newPoints = currentPoints + memberLevel.getPoints();
        user.setPoints(newPoints);

        int updated = userMapper.updateById(user);
        if (updated < 1) {
            throw new ClientException("500", "开通会员失败");
        }

        // 记录积分变动
        userPointsLogService.updateUserPoints(
                user.getUsername(),
                memberLevel.getPoints(),
                "开通" + memberLevel.getName() + "奖励积分"
        );

        log.info("用户{}开通{}成功，有效期至{}", user.getUsername(), memberLevel.getName(), expireTime);
    }

    /**
     * 购买积分加油包
     * @param userId 用户ID
     * @param pkg    加油包类型
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void purchasePointsPackage(Long userId, PointsPackageEnum pkg) {
        if (pkg == null) {
            throw new ClientException("500", "无效的加油包类型");
        }

        // 检查用户是否可以购买加油包
        if (!canPurchasePointsPackage(userId)) {
            throw new ClientException("500", "体验会员无法购买积分加油包");
        }

        UserDO user = userMapper.selectById(userId);
        if (user == null) {
            throw new ClientException("500", "用户不存在");
        }

        // 增加积分
        int currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        int newPoints = currentPoints + pkg.getPoints();
        user.setPoints(newPoints);

        int updated = userMapper.updateById(user);
        if (updated < 1) {
            throw new ClientException("500", "购买加油包失败");
        }

        // 记录积分变动
        userPointsLogService.updateUserPoints(
                user.getUsername(),
                pkg.getPoints(),
                "购买" + pkg.getName() + "奖励积分"
        );

        log.info("用户{}购买{}成功，获得{}积分", user.getUsername(), pkg.getName(), pkg.getPoints());
    }

    /**
     * 检查会员状态
     * @param userId 用户ID
     */
    @Override
    public void checkMemberStatus(Long userId) {
        UserDO user = userMapper.selectById(userId);
        if (user == null) {
            return;
        }

        // 检查会员是否过期
        if (user.getMemberLevel() != null && user.getMemberLevel() > 0) {
            Date expireTime = user.getMemberExpireTime();
            if (expireTime != null && expireTime.before(new Date())) {
                // 会员已过期，重置为普通用户
                userMapper.update(null, new LambdaUpdateWrapper<UserDO>()
                        .eq(UserDO::getId, userId)
                        .set(UserDO::getMemberLevel, 0)
                        .set(UserDO::getMemberExpireTime, null)
                );
                log.info("用户{}会员已过期，重置为普通用户", user.getUsername());
            }
        }
    }

    /**
     * 检查用户是否可以购买加油包
     * @param userId 用户ID
     * @return true表示可以购买，false表示不能购买
     */
    @Override
    public boolean canPurchasePointsPackage(Long userId) {
        UserDO user = userMapper.selectById(userId);
        if (user == null) {
            return false;
        }

        // 体验会员无法购买加油包
        Integer memberLevel = user.getMemberLevel();
        if (memberLevel != null && memberLevel == MemberLevelEnum.TRIAL.getCode()) {
            return false;
        }

        return true;
    }

    /**
     * 计算会员到期时间
     */
    private Date calculateExpireTime(int validMonths) {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.MONTH, validMonths);
        return calendar.getTime();
    }
}
