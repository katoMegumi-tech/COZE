package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.UserPointsAccountDO;
import com.cqie.admin.entity.UserPointsLogDO;
import com.cqie.admin.mapper.UserPointsAccountMapper;
import com.cqie.admin.mapper.UserPointsLogMapper;
import com.cqie.admin.service.UserPointsLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPointsLogServiceImpl extends ServiceImpl<UserPointsLogMapper, UserPointsLogDO> implements UserPointsLogService {

    private final UserPointsAccountMapper userPointsAccountMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUserPoints(String username, int points, String remark) {
        if (username == null || username.trim().isEmpty()) {
            throw new ClientException("500", "用户名不能为空");
        }

        // 积分日志当前值改为账户总积分（A类月赠 + B类加油包）
        UserPointsAccountDO account = userPointsAccountMapper.selectById(username);
        if (account == null) {
            throw new ClientException("500", "积分账户不存在");
        }

        int monthly = account.getMonthlyPoints() == null ? 0 : account.getMonthlyPoints();
        int extra = account.getExtraPoints() == null ? 0 : account.getExtraPoints();
        int currentTotalPoints = monthly + extra;

        baseMapper.insert(
                UserPointsLogDO.builder()
                        .username(username)
                        .changePoints(points)
                        .currentPoints(currentTotalPoints)
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
