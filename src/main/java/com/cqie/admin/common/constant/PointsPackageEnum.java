package com.cqie.admin.common.constant;

import lombok.Getter;

import java.util.Arrays;

/**
 * 积分加油包枚举
 */
@Getter
public enum PointsPackageEnum {

    /**
     * 积分加油包：100元 2300积分 有效期3个月
     */
    STANDARD("STANDARD", "积分加油包", 10000, 2300, 3);

    /**
     * 加油包编码
     */
    private final String code;

    /**
     * 加油包名称
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

    PointsPackageEnum(String code, String name, int price, int points, int validMonths) {
        this.code = code;
        this.name = name;
        this.price = price;
        this.points = points;
        this.validMonths = validMonths;
    }

    public static PointsPackageEnum getByPrice(int price) {
        return Arrays.stream(values())
                .filter(e -> e.price == price)
                .findFirst()
                .orElse(null);
    }
}
