package com.cqie.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 用户注册请求参数
 */
@Data
@Schema(description = "用户注册请求参数")
public class UserRegisterRequest {
    
    @Schema(description = "登录账号", required = true, example = "admin")
    // 登录账号
    private String username;

    @Schema(description = "密码（密文）", required = true, example = "123456")
    // 密码（密文）
    private String password;

    @Schema(description = "昵称", example = "管理员")
    // 昵称
    private String nickname;

    @Schema(description = "手机号", example = "13800138000")
    // 手机号
    private String phone;

    @Schema(description = "邮箱", example = "admin@example.com")
    // 邮箱
    private String email;
}
