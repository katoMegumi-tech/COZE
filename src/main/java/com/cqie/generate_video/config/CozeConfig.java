package com.cqie.generate_video.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "coze")
public class CozeConfig {

    private String token;

    private String baseUrl;

    private String botId;
    
    private String workflowId;
    
    private String copywritingWorkflowId;

    /**
     * 工作流超时时间（分钟），默认 10 分钟
     */
    private Integer timeoutMinutes = 10;
}
