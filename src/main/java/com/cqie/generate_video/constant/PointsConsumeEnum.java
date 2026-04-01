package com.cqie.generate_video.constant;

import lombok.Getter;

/**
 * 积分消耗枚举
 * 定义系统内所有需要消耗积分的功能类型
 */
@Getter
public enum PointsConsumeEnum {

    /**
     * 视频生成消耗积分
     */
    VIDEO_GENERATION(-10, "视频生成功能消耗积分"),

    /**
     * 小红书文案生成消耗积分
     */
    XIAOHONGSHU_COPY_GENERATION(-5, "小红书文案生成功能消耗积分"),


    /**
     * 新用户注册奖励
     */
    NEW_USER_REGISTER(100, "新用户注册奖励积分");


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
