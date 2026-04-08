package com.cqie.generate_video.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * Coze 工作流请求参数
 */
@Data
@Schema(description = "视频生成请求参数")
public class CozeWorkflowRequest {

    @Schema(description = "档位选择：std-标准质量(25积分/秒)，premium-高级质量(30积分/秒)", example = "std", allowableValues = {"std", "premium"})
    @NotBlank(message = "档位选择不能为空")
    private String gearSelection;

    @Schema(description = "图片ID列表")
    private List<String> images;

    @Schema(description = "视频URL列表（用于参考视频）", example = "[\"https://example.com/video1.mp4\"]")
    private List<String> videos;

    @Schema(description = "产品名称", example = "饺同学鲜制水饺")
    private String productName;
    
    @Schema(description = "产品描述", example = "饺同学鲜制水饺，高端食材，皮蛋黑虎虾馅料")
    private String productDesc;
    
    @Schema(description = "产品特点", example = "实惠")
    private String productFeatures;
    
    @Schema(description = "产品价格", example = "9.9")
    private String productPrice;
    
    @Schema(description = "视频宽高比", example = "16:9", allowableValues = {"9:16", "16:9"})
    private String videoAspectRatio;
    
    @Schema(description = "视频长度（秒）", example = "10", minimum = "5", maximum = "15")
    @Min(value = 5, message = "视频长度最少 5 秒")
    @Max(value = 15, message = "视频长度最多 15 秒")
    private Integer videoLength;
    
    @Schema(description = "视频场景", example = "厨房")
    private String videoScene;
    
    @Schema(description = "视频风格", example = "电商")
    private String videoStyle;

    @Schema(description = "视频数量", example = "1")
    private Integer videoNum;

    @Schema(description = "视频分辨率", example = "720P")
    private String videoResolution;

    @Schema(description = "是否添加字幕", example = "false")
    private Boolean videoSubtitle;

}
