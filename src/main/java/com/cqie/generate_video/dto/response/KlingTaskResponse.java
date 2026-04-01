package com.cqie.generate_video.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kling AI 视频生成响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kling AI 视频生成响应")
public class KlingTaskResponse {
    
    @Schema(description = "状态码", example = "0")
    private int code;
    
    @Schema(description = "消息")
    private String message;
    
    @Schema(description = "请求ID")
    private String request_id;
    
    @Schema(description = "任务数据")
    private TaskData data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskData {
        private String task_id;
        private TaskInfo task_info;
        private String task_status;
        private String task_status_msg;
        private TaskResult task_result;
        private WatermarkInfo watermark_info;
        private String final_unit_deduction;
        private long created_at;
        private long updated_at;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskInfo {
        private String external_task_id;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskResult {
        private java.util.List<Video> videos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Video {
        private String id;
        private String url;
        private String watermark_url;
        private String duration;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WatermarkInfo {
        private boolean enabled;
    }
}
