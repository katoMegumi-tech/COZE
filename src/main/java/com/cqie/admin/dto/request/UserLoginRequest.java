package com.cqie.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 用户登录请求参数
 */
@Data
@Schema(description = "用户登录请求参数")
public class UserLoginRequest {

    @Schema(description = "用户名", required = true, example = "admin")
    private String username;

    @Schema(description = "密码", required = true, example = "123456")
    private String password;
}
