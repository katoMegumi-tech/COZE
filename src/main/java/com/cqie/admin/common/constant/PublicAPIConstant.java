package com.cqie.admin.common.constant;

import org.springframework.util.AntPathMatcher;

import java.util.List;

public class PublicAPIConstant {

    // 公开API
    public static final List<String> PUBLIC_API_SET = List.of(
            "/api/admin/user/login", // 登录接口
            "/api/admin/user/register", // 注册接口
            "/api/upload/coze", // 上传接口
            "/api/copywriting/**", //生成文案
            "/api/coze/workflow/**", //调用工作流
            "/v3/api-docs/**",     // Swagger API文档
            "/swagger-ui/**",
            "/swagger-ui.html"
    );

    // Spring 路径匹配器（单例，线程安全）
    public static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    /**
     * 判断是否为公开接口
     * @param requestURI 请求URI
     * @return true表示公开接口，false表示需要认证
     */
    public static boolean isPublicPath(String requestURI) {
        // 遍历所有公开接口路径，用AntPathMatcher做通配符匹配
        for (String pattern : PublicAPIConstant.PUBLIC_API_SET) {
            if (PublicAPIConstant.PATH_MATCHER.match(pattern, requestURI)) {
                return true;
            }
        }
        // 无匹配则返回false
        return false;
    }
}
