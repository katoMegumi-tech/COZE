package com.cqie.generate_video.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 查询任务状态响应（只返回视频 URL）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "查询视频生成任务状态响应")
public class QueryTaskStatusResponse {
    
    @Schema(description = "视频 URL", example = "https://example.com/video.mp4")
    private String video_url;
    
    @Schema(description = "带水印的视频 URL", example = "https://example.com/video_watermark.mp4")
    private String watermark_video_url;
    
    @Schema(description = "任务状态", example = "succeed")
    private String task_status;
    
    @Schema(description = "视频时长（秒）", example = "10")
    private String duration;
}
