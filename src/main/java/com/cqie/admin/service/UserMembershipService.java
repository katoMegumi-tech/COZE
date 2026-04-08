package com.cqie.admin.service;


import com.baomidou.mybatisplus.extension.service.IService;
import com.cqie.admin.common.constant.MemberLevel;
import com.cqie.admin.entity.UserMembershipDO;

public interface UserMembershipService extends IService<UserMembershipDO> {
    /**
     * 购买/续费/升级会员
     */
    void buyMember(String username, int targetLevelCode);

    /**
     * 获取当前有效会员等级（若过期则返回 NONE）
     */
    MemberLevel getCurrentLevel(String username);
}
