package com.cqie.admin.dto.response;

import lombok.Data;

/**
 * 获取用户信息响应
 */

@Data
public class UserGetUserResponse {

    // 登录账号
    private String username;

    // 昵称
    private String nickname;

    // 手机号
    private String phone;

    // 邮箱
    private String email;

    // 用户积分
    private Integer points;
}
