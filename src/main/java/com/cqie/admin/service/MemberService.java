package com.cqie.admin.service;

import com.cqie.admin.common.constant.MemberLevelEnum;
import com.cqie.admin.common.constant.PointsPackageEnum;

/**
 * 会员服务接口
 */
public interface MemberService {

    /**
     * 开通会员
     *
     * @param userId      用户ID
     * @param memberLevel 会员等级
     */
    void openMember(Long userId, MemberLevelEnum memberLevel);

    /**
     * 购买积分加油包
     *
     * @param userId 用户ID
     * @param pkg    加油包类型
     */
    void purchasePointsPackage(Long userId, PointsPackageEnum pkg);

    /**
     * 检查用户会员状态，更新过期会员
     *
     * @param userId 用户ID
     */
    void checkMemberStatus(Long userId);

    /**
     * 判断用户是否可以购买加油包（体验会员无法购买）
     *
     * @param userId 用户ID
     * @return true-可以购买，false-不可购买
     */
    boolean canPurchasePointsPackage(Long userId);
}
