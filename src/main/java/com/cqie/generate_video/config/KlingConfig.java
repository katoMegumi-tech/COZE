package com.cqie.generate_video.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "kling")
public class KlingConfig {
    private String accessKey;
    private String secretKey;
    private String baseUrl;
    private Integer tokenExpireSeconds = 1800;
}
