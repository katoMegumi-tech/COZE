package com.cqie.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 微信小程序登录请求
 */
@Schema(description = "微信小程序登录请求")
@Data
public class WechatLoginRequest {

    @Schema(description = "微信登录临时凭证code", required = true)
    private String code;
}
