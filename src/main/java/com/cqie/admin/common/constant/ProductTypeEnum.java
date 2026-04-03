package com.cqie.admin.common.constant;

import lombok.Getter;

import java.util.Arrays;

/**
 * 产品类型枚举
 */
@Getter
public enum ProductTypeEnum {

    /**
     * 会员购买
     */
    MEMBER("MEMBER", "会员购买"),

    /**
     * 积分加油包
     */
    POINTS_PACKAGE("POINTS_PACKAGE", "积分加油包");

    private final String code;
    private final String desc;

    ProductTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static ProductTypeEnum getByCode(String code) {
        return Arrays.stream(values())
                .filter(e -> e.code.equals(code))
                .findFirst()
                .orElse(null);
    }
}
