package com.cqie.generate_video.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kling AI 视频生成请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kling AI 视频生成请求参数")
public class KlingTaskRequest {
    
    @Schema(description = "模型名称", example = "kling-v3-omni")
    @Builder.Default
    private String model_name = "kling-v3-omni";
    
    @Schema(description = "是否多镜片", example = "false")
    @Builder.Default
    private Boolean multi_shot = false;
    
    @Schema(description = "镜片类型")
    private String shot_type;
    
    @Schema(description = "提示词", required = true, example = "A woman walking in rain with red coat")
    private String prompt;
    
    @Schema(description = "多提示词列表")
    private List<MultiPrompt> multi_prompt;
    
    @Schema(description = "图片列表")
    private List<ImageItem> image_list;
    
    @Schema(description = "元素列表")
    private List<ElementItem> element_list;
    
    @Schema(description = "视频列表")
    private List<VideoItem> video_list;
    
    @Schema(description = "声音状态", example = "on")
    @Builder.Default
    private String sound = "on";
    
    @Schema(description = "生成模式", example = "pro")
    @Builder.Default
    private String mode = "pro";
    
    @Schema(description = "宽高比", example = "16:9")
    private String aspect_ratio;
    
    @Schema(description = "持续时间", example = "5")
    @Builder.Default
    private String duration = "5";
    
    @Schema(description = "水印信息")
    private WatermarkInfo watermark_info;
    
    @Schema(description = "回调地址")
    private String callback_url;
    
    @Schema(description = "外部任务ID")
    private String external_task_id;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MultiPrompt {
        private int index;
        private String prompt;
        private String duration;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageItem {
        private String image_url;
        private String type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ElementItem {
        private long element_id;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoItem {
        private String video_url;
        private String refer_type;
        private String keep_original_sound;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WatermarkInfo {
        private boolean enabled;
    }
}
