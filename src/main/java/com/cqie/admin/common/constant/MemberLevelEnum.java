package com.cqie.admin.common.constant;

import lombok.Getter;

import java.util.Arrays;

/**
 * 会员等级枚举
 */
@Getter
public enum MemberLevelEnum {

    /**
     * 普通用户（非会员）
     */
    NORMAL(0, "普通用户", 0, 0, 0),

    /**
     * 体验会员：29.9元 600积分 有效期1个月
     */
    TRIAL(1, "体验会员", 2990, 600, 1),

    /**
     * VIP会员：99元 2100积分 有效期3个月
     */
    VIP(2, "VIP会员", 9900, 2100, 3),

    /**
     * SVIP会员：399元 8600积分 有效期1年
     */
    SVIP(3, "SVIP会员", 39900, 8600, 12);

    /**
     * 会员等级编码
     */
    private final int code;

    /**
     * 会员等级名称
     */
    private final String name;

    /**
     * 价格（单位：分）
     */
    private final int price;

    /**
     * 赠送积分数
     */
    private final int points;

    /**
     * 有效期（单位：月）
     */
    private final int validMonths;

    MemberLevelEnum(int code, String name, int price, int points, int validMonths) {
        this.code = code;
        this.name = name;
        this.price = price;
        this.points = points;
        this.validMonths = validMonths;
    }

    /**
     * 根据code获取枚举
     */
    public static MemberLevelEnum getByCode(int code) {
        return Arrays.stream(values())
                .filter(e -> e.code == code)
                .findFirst()
                .orElse(NORMAL);
    }

    /**
     * 根据价格获取会员等级（用于支付回调匹配）
     */
    public static MemberLevelEnum getByPrice(int price) {
        return Arrays.stream(values())
                .filter(e -> e.price == price)
                .findFirst()
                .orElse(null);
    }
}
