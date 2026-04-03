package com.cqie.generate_video.constant;

import lombok.Getter;

/**
 * 积分消耗枚举
 * 定义系统内所有需要消耗积分的功能类型
 */
@Getter
public enum PointsConsumeEnum {

    /**
     * 新用户注册奖励
     */
    NEW_USER_REGISTER(100, "新用户注册奖励积分"),

    /**
     * 标准质量视频生成：每秒25积分
     */
    VIDEO_STANDARD(-25, "标准质量视频生成消耗积分（每秒）"),

    /**
     * 高级质量视频生成：每秒30积分
     */
    VIDEO_PREMIUM(-30, "高级质量视频生成消耗积分（每秒）"),

    /**
     * 小红书文案生成消耗积分
     */
    XIAOHONGSHU_COPY_GENERATION(-5, "小红书文案生成功能消耗积分"),

    /**
     * 会员购买奖励积分
     */
    MEMBER_PURCHASE(0, "会员购买奖励积分"),

    /**
     * 积分加油包购买
     */
    POINTS_PACKAGE_PURCHASE(0, "积分加油包购买");

    // 扣除的积分数
    private final int points;

    // 扣除描述
    private final String desc;

    // 构造方法
    PointsConsumeEnum(int points, String desc) {
        this.points = points;
        this.desc = desc;
    }

}
