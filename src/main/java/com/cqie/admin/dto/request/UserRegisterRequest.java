package com.cqie.admin.dto.request;

import lombok.Data;

/**
 * 用户注册请求参数
 */
@Data
public class UserRegisterRequest {
    // 登录账号
    private String username;

    // 密码（密文）
    private String password;

    // 昵称
    private String nickname;

    // 手机号
    private String phone;

    // 邮箱
    private String email;
}
