package com.cqie.generate_video.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Coze 工作流请求参数
 */
@Data
@Schema(description = "视频生成请求参数")
public class CozeWorkflowRequest {

    @Schema(description = "文件 ID（从文件上传接口获取）", required = true, example = "1234567890")
    @NotBlank(message = "文件 ID 不能为空")
    private String fileId;

    @Schema(description = "产品名称（可选）", example = "智能手表")
    private String productName;
    
    @Schema(description = "产品描述（可选）", example = "一款功能强大的智能手表")
    private String productDesc;
    
    @Schema(description = "产品特点", example = "防水、长续航、健康监测")
    private String productFeatures;
    
    @Schema(description = "产品价格", example = "999")
    private String productPrice;
    
    @Schema(description = "视频宽高比", example = "16:9", allowableValues = {"9:16", "16:9"})
    private String videoAspectRatio;
    
    @Schema(description = "视频长度（秒）", example = "10", minimum = "5", maximum = "12")
    @Min(value = 5, message = "视频长度最少 5 秒")
    @Max(value = 12, message = "视频长度最多 12 秒")
    private Integer videoLength;
    
    @Schema(description = "生成数量（固定为 1）", example = "1", minimum = "1", maximum = "1")
    @Min(value = 1, message = "生成数量只能为 1")
    @Max(value = 1, message = "生成数量只能为 1")
    private Integer videoNum;
    
    @Schema(description = "视频清晰度", example = "720P", allowableValues = {"720P", "1080P"})
    private String videoResolution;
    
    @Schema(description = "视频场景", example = "产品展示")
    private String videoScene;
    
    @Schema(description = "视频风格", example = "科技感")
    private String videoStyle;
    
    @Schema(description = "是否添加字幕", example = "false")
    private Boolean videoSubtitle;

}
