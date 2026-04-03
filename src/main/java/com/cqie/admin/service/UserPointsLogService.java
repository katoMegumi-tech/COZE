package com.cqie.admin.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.cqie.admin.entity.UserPointsLogDO;

public interface UserPointsLogService extends IService<UserPointsLogDO> {

    void updateUserPoints(String username, int points, String remark);

    /**
     * 分页查询用户积分日志
     *
     * @param current  当前页
     * @param size     每页大小
     * @return 分页结果
     */
    IPage<UserPointsLogDO> getPointsLogPage(long current, long size);


}
