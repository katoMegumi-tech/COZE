package com.cqie.admin.common.filter;


import com.cqie.admin.util.JwtUtil;
import com.cqie.admin.util.RedisUtil;
import com.cqie.generate_video.result.Result;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import static com.cqie.admin.common.constant.PublicAPIConstant.isPublicPath;

@Component
@Slf4j
/**
 * JWT认证过滤器
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter{

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String jwt = parseJwt(request);
        String requestURI = request.getRequestURI();


        log.info("请求URI：{}", requestURI);

        // 公开接口
        if (isPublicPath(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 检查jwt是否为空
        if (jwt == null) {
            log.info("缺少认证令牌");
            sendUnauthorizedResponse(response, "缺少认证令牌");
            return;
        }


        // 检查令牌是否有效
        if (!jwtUtil.validateToken(jwt)) {
            log.info("令牌无效或已过期");
            sendUnauthorizedResponse(response, "令牌无效或已过期");
            return;
        }

        // 创建认证对象，包含用户名、密码（null表示已通过JWT验证无需密码）和权限列表
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                JwtUtil.extractUsername(jwt),  // 从JWT中提取用户名
                null,                          // 不需要密码，因为JWT已经验证了身份
                AuthorityUtils.NO_AUTHORITIES
        );

        // 将认证信息存储到安全上下文中
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);

        filterChain.doFilter(request, response);
    }


    private String parseJwt(HttpServletRequest request) {
        //从请求头中获取jwt
        String headerAuth = request.getHeader("Authorization");

        //判断请求头中是否有jwt
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }

    /**
     * 发送未授权响应
     * @param response 响应对象
     * @param message 错误信息
     * @throws IOException
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                objectMapper.writeValueAsString(Result.error(message))
        );
    }
}
