package com.cqie.generate_video.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * 文案生成请求参数
 */
@Data
@Schema(description = "文案生成请求参数")
public class CopywritingRequest {
    
    @Schema(description = "文件ID列表（从文件上传接口获取）", example = "[\"7619656250259341366\"]")
    private List<String> fileIds;
    
    @Schema(description = "产品/服务名称", required = true, example = "小米全新一代SU7")
    @NotBlank(message = "产品/服务名称不能为空")
    private String productServiceName;
    
    @Schema(description = "核心卖点", example = "安全、驾控、智能体验和豪华质感等方面全面升级")
    private String coreSellingPoints;
    
    @Schema(description = "目标受众", example = "年轻人")
    private String targetAudience;
    
    @Schema(description = "使用场景", example = "运动")
    private String usageScenario;
    
    @Schema(description = "文案类型", example = "宣传文案")
    private String copyType;
    
    @Schema(description = "语气风格", example = "活泼")
    private String toneStyle;
    
    @Schema(description = "字数限制", example = "300")
    private String wordCountLimit;
    
    @Schema(description = "结构偏好", example = "总分总")
    private String structurePreference;
    
    @Schema(description = "关键词", example = "安全、驾控、智能")
    private String keywords;
    
    @Schema(description = "禁用词", example = "虚假宣传")
    private String forbiddenWords;
    
    @Schema(description = "参考链接", example = "https://www.autohome.com.cn/news/202603/1312989.html")
    private String referenceLink;
}
