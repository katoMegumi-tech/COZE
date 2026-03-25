package com.cqie.demo01.dto.response;

import lombok.Data;
import java.util.List;

/**
 * 视频生成响应（简化版）
 */
@Data
public class VideoGenerationResponse {
    
    /**
     * 生成的视频 URL 列表
     */
    private List<String> videoUrls;
    
    /**
     * 生成的视频数量
     */
    private Integer count;
    
    /**
     * 第一个视频 URL（便捷访问）
     */
    private String firstVideoUrl;
    
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
