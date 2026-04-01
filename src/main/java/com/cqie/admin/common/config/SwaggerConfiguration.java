package com.cqie.admin.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI 配置类
 * 
 * @author CQIE
 * @date 2026-04-01
 */
@Configuration
public class SwaggerConfiguration {

    @Value("${server.port:8088}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .openapi("3.1.0")
                .info(new Info()
                        .title("Coze Video Generation API")
                        .version("1.0.0")
                        .description("Coze 视频生成 API 接口文档")
                        .contact(new Contact()
                                .name("CQIE Team")
                                .email("support@cqie.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("本地开发环境")
                ))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .schemaRequirement("Bearer Authentication", createSecurityScheme());
    }

    private SecurityScheme createSecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT 认证，格式：Bearer {token}");
    }
}
