package com.cqie.admin.dto.response;

import lombok.Data;

/**
 * 用户注册响应
 */
@Data
public class UserRegisterResponse {

    // 登录账号
    private String username;

    // 昵称
    private String nickname;

    // 邮箱
    private String email;

    // 用户积分
    private Integer points;
}
