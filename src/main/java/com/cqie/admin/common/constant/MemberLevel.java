package com.cqie.admin.common.constant;

import lombok.Getter;

@Getter
public enum MemberLevel {
    NONE(0, "无会员", 0, 0),
    TRIAL(1, "体验会员", 600, 29.9),
    VIP(2, "VIP会员", 2100, 99.0),
    SVIP(3, "SVIP会员", 8600, 399.0);

    private final int code;
    private final String name;
    private final int monthlyPoints;
    private final double monthlyPrice;

    MemberLevel(int code, String name, int monthlyPoints, double monthlyPrice) {
        this.code = code;
        this.name = name;
        this.monthlyPoints = monthlyPoints;
        this.monthlyPrice = monthlyPrice;
    }

    public static MemberLevel fromCode(int code) {
        for (MemberLevel level : values()) {
            if (level.code == code) return level;
        }
        throw new IllegalArgumentException("无效的会员等级: " + code);
    }

    public boolean canBuyExtraPackage() {
        return this == VIP || this == SVIP;
    }

    public boolean canUpgradeTo(MemberLevel target) {
        return target.code >= this.code;
    }
}
