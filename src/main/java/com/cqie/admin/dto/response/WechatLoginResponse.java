package com.cqie.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 微信小程序登录响应
 */
@Schema(description = "微信小程序登录响应")
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class WechatLoginResponse {

    @Schema(description = "登录账号")
    private String username;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "邮箱")
    private String email;

    @Schema(description = "用户积分")
    private Integer points;

    @Schema(description = "访问令牌")
    private String token;
}
