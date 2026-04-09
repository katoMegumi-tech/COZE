package com.cqie.admin.dto.request.MembershipDebug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "调试-会员状态查询请求")
public class MembershipStatusDebugRequest {
    @Schema(description = "调试用户名，不传则使用默认 test02", example = "test02")
    private String username;
}