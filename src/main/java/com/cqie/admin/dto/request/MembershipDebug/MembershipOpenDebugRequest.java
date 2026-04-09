package com.cqie.admin.dto.request.MembershipDebug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "会员调试请求参数")
@Data
public class MembershipOpenDebugRequest {

    @Schema(description = "调试用户名，不传则使用默认 test02", example = "test02")
    private String username;

    @Schema(description = "会员等级：TRIAL/VIP/SVIP（兼容 EXPERIENCE）", example = "VIP")
    private String memberLevel;
}
