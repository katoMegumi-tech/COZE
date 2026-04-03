package com.cqie.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.entity.UserDO;
import com.cqie.admin.entity.UserPointsLogDO;
import com.cqie.admin.mapper.UserMapper;
import com.cqie.admin.mapper.UserPointsLogMapper;
import com.cqie.admin.service.UserPointsLogService;
import com.cqie.admin.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserPointsLogServiceImpl extends ServiceImpl<UserPointsLogMapper, UserPointsLogDO> implements UserPointsLogService {

    @Autowired
    private UserMapper UserMapper;

    /**
     * 更新用户积分
     * 功能说明：
     * 1. 验证用户是否存在
     * 2. 验证积分变更值的有效性
     * 3. 更新用户积分
     * 4. 记录积分变更日志
     * 
     * @param username 用户名
     * @param points 积分变更值（正数表示增加，负数表示减少）
     * @throws ClientException 当用户不存在或参数无效时抛出异常
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUserPoints(String username, int points, String remark) {
        // 参数验证
        if (username == null || username.trim().isEmpty()) {
            throw new ClientException("500" ,"用户名不能为空");
        }
        
        // 查询用户
        UserDO user = UserMapper.selectOne(
            new LambdaQueryWrapper<UserDO>()
                .eq(UserDO::getUsername, username)
        );
        
        if (user == null) {
            throw new ClientException("500" ,"用户不存在");
        }
        
        // 检查积分变更后是否会变为负数
        int currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        Integer newPoints = currentPoints + points;
        
        if (newPoints < 0) {
            throw new ClientException("500" ,"积分不足，无法完成扣除");
        }
        
        // 更新用户积分
        user.setPoints(newPoints);
        boolean updateSuccess = UserMapper.updateById(user) > 0;
        
        if (!updateSuccess) {
            throw new ClientException("500" ,"更新用户积分失败");
        }

        // 记录积分变更日志
        baseMapper.insert(
                UserPointsLogDO.builder()
                    .username(username)
                    .changePoints(points)
                    .currentPoints(newPoints)
                    .remark(remark)
                    .build()
        );
    }

    /**
     * 分页查询用户积分日志
     *
     * @param current  当前页
     * @param size     每页大小
     * @return 分页结果
     */
    @Override
    public IPage<UserPointsLogDO> getPointsLogPage(long current, long size) {
        // 创建分页对象
        Page<UserPointsLogDO> page = new Page<>(current, size);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        // 构建查询条件
        LambdaQueryWrapper<UserPointsLogDO> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserPointsLogDO::getUsername, username)
                    .orderByDesc(UserPointsLogDO::getCreateTime);

        // 执行分页查询
        return baseMapper.selectPage(page, queryWrapper);
    }

}
