package com.cqie.generate_video.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;

/**
 * 视频生成响应（简化版）
 */
@Schema(description = "视频生成响应")
@Data
public class VideoGenerationResponse {
    
    @Schema(description = "生成的视频 URL 列表")
    /**
     * 生成的视频 URL 列表
     */
    private List<String> videoUrls;
    
    @Schema(description = "生成的视频数量")
    /**
     * 生成的视频数量
     */
    private Integer count;
    
    @Schema(description = "第一个视频 URL（便捷访问）")
    /**
     * 第一个视频 URL（便捷访问）
     */
    private String firstVideoUrl;
    
    @Schema(description = "任务状态：COMPLETED, FAILED, NO_RESPONSE")
    /**
     * 任务状态：COMPLETED, FAILED, NO_RESPONSE
     */
    private String status;
    
    public VideoGenerationResponse(List<String> videoUrls, String status) {
        this.videoUrls = videoUrls;
        this.count = videoUrls != null ? videoUrls.size() : 0;
        this.firstVideoUrl = (videoUrls != null && !videoUrls.isEmpty()) ? videoUrls.get(0) : null;
        this.status = status;
    }
}
