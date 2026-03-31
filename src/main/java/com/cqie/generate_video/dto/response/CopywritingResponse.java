package com.cqie.generate_video.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 文案生成响应
 */
@Data
@Schema(description = "文案生成响应")
public class CopywritingResponse {
    
    @Schema(description = "任务ID（异步模式返回）")
    private String taskId;

    @Schema(description = "生成的文案内容（Group1字段）")
    private String content;
    
    @Schema(description = "输出链接列表")
    private List<String> outputLinks;
    
    @Schema(description = "状态：SUCCESS(成功)、FAILED(失败)、PROCESSING(处理中)")
    private String status;
    
    @Schema(description = "错误信息（失败时返回）")
    private String errorMessage;
    
    @Schema(description = "调试数据（完整响应）")
    private String debugData;
}
