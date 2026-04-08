package com.cqie;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Coze 视频生成 API 应用启动类
 */
@SpringBootApplication(scanBasePackages = "com.cqie")
public class CozeVideoApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CozeVideoApiApplication.class, args);
    }
}
