package com.cqie.admin.dto.request;

import lombok.Data;

/**
 * 用户登录请求参数
 */
@Data
public class UserLoginRequest {

    private String username;

    private String password;
}
