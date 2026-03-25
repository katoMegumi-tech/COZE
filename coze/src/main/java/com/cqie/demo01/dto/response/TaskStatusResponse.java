package com.cqie.demo01.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 任务状态响应
 */
@Data
@Schema(description = "任务状态响应")
public class TaskStatusResponse {
    
    @Schema(description = "任务ID")
    private String taskId;
    
    @Schema(description = "任务状态：PENDING(等待中)、PROCESSING(生成中)、COMPLETED(已完成)、FAILED(失败)")
    private String status;
    
    @Schema(description = "进度百分比 0-100")
    private Integer progress;
    
    @Schema(description = "状态描述")
    private String message;
    
    @Schema(description = "视频URL列表（完成时返回）")
    private List<String> videoUrls;
    
    @Schema(description = "错误信息（失败时返回）")
    private String errorMessage;
}
