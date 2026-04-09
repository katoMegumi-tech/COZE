package com.cqie.admin.dto.request.MembershipDebug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "调试-购买加油包请求")
public class MembershipBuyExtraDebugRequest {
    @Schema(description = "调试用户名，不传则使用默认 test02", example = "test02")
    private String username;

    @Schema(description = "加油包积分，不传默认2300", example = "2300")
    private Integer extraPoints;
}
