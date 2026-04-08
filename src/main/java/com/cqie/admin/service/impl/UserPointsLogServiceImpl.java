package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.entity.UserPointsAccountDO;
import com.cqie.admin.entity.UserPointsLogDO;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.mapper.UserPointsAccountMapper;
import com.cqie.admin.mapper.UserPointsLogMapper;
import com.cqie.admin.service.UserPointsLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPointsLogServiceImpl extends ServiceImpl<UserPointsLogMapper, UserPointsLogDO> implements UserPointsLogService {

    @Autowired
    private UserMapper UserMapper;

    @Autowired
    private UserPointsAccountMapper userPointsAccountMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUserPoints(String username, int points, String remark) {
        if (username == null || username.trim().isEmpty()) {
            throw new ClientException("500", "用户名不能为空");
        }

        UserDO user = UserMapper.selectOne(
            new LambdaQueryWrapper<UserDO>()
                .eq(UserDO::getUsername, username)
        );

        if (user == null) {
            throw new ClientException("500", "用户不存在");
        }

        int currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        int newPoints = currentPoints + points;

        if (points < 0) {
            int needCost = -points;
            UserPointsAccountDO account = userPointsAccountMapper.selectById(username);
            if (account == null) {
                throw new ClientException("500", "积分账户不存在");
            }

            int monthly = account.getMonthlyPoints() == null ? 0 : account.getMonthlyPoints();
            int extra = account.getExtraPoints() == null ? 0 : account.getExtraPoints();

            if (monthly + extra < needCost) {
                throw new ClientException("500", "积分不足，无法完成扣除");
            }

            int fromMonthly = Math.min(monthly, needCost);
            monthly -= fromMonthly;
            int remain = needCost - fromMonthly;
            if (remain > 0) {
                extra -= remain;
            }

            account.setMonthlyPoints(monthly);
            account.setExtraPoints(extra);
            userPointsAccountMapper.updateById(account);
        } else if (newPoints < 0) {
            throw new ClientException("500", "积分不足，无法完成扣除");
        }

        user.setPoints(newPoints);
        boolean updateSuccess = UserMapper.updateById(user) > 0;

        if (!updateSuccess) {
            throw new ClientException("500", "更新用户积分失败");
        }

        baseMapper.insert(
                UserPointsLogDO.builder()
                    .username(username)
                    .changePoints(points)
                    .currentPoints(newPoints)
                    .remark(remark)
                    .build()
        );
    }

    @Override
    public IPage<UserPointsLogDO> getPointsLogPage(long current, long size) {
        Page<UserPointsLogDO> page = new Page<>(current, size);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        LambdaQueryWrapper<UserPointsLogDO> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserPointsLogDO::getUsername, username)
                    .orderByDesc(UserPointsLogDO::getCreateTime);

        return baseMapper.selectPage(page, queryWrapper);
    }

}
