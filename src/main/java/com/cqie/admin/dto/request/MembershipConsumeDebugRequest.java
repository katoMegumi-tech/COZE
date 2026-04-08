package com.cqie.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "调试-积分扣费请求")
public class MembershipConsumeDebugRequest {
    @Schema(description = "调试用户名，不传则使用默认 test02", example = "test02")
    private String username;

    @Schema(description = "视频秒数", example = "10")
    private Integer seconds;

    @Schema(description = "质量档位：std/premium", example = "std")
    private String quality;
}