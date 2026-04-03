package com.cqie.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Schema(description = "积分日志响应")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PointsLogResponse {

    @Schema(description = "变更积分")
    private Integer changePoints;

    @Schema(description = "当前积分")
    private Integer currentPoints;

    @Schema(description = "备注")
    private String remark;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}
