package com.cqie.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 获取用户信息响应
 */
@Schema(description = "获取用户信息响应")
@Data
public class UserGetUserResponse {

    @Schema(description = "登录账号")
    // 登录账号
    private String username;

    @Schema(description = "昵称")
    // 昵称
    private String nickname;

    @Schema(description = "手机号")
    // 手机号
    private String phone;

    @Schema(description = "邮箱")
    // 邮箱
    private String email;

    @Schema(description = "用户积分")
    // 用户积分
    private Integer points;
}
