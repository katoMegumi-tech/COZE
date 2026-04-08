package com.cqie.admin.service;


import com.baomidou.mybatisplus.extension.service.IService;
import com.cqie.admin.entity.UserPointsAccountDO;

public interface UserPointsAccountService extends IService<UserPointsAccountDO> {
    /**
     * 消耗积分（生成任务时调用）
     */
    void consumePoints(String username, int seconds, String quality);

    /**
     * 购买加油包（支付成功回调）
     */
    void addExtraPoints(String username, int points);
}
