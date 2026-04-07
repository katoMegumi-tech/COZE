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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
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

    @Autowired
    private UserDetailsService userDetailsService;


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
            sendUnauthorizedResponse(response, "缺少认证令牌，请重新登录");
            return;
        }


        // 检查令牌是否有效
        if (!jwtUtil.validateToken(jwt)) {
            log.info("令牌无效或已过期");
            sendUnauthorizedResponse(response, "令牌无效或已过期");
            return;
        }

        // 从 token 中提取用户名
        String username = JwtUtil.extractUsername(jwt);
        if (username == null) {
            sendUnauthorizedResponse(response, "令牌中未包含用户名");
            return;
        }

        // 使用 UserDetailsService 加载用户及其权限
        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(username);
        } catch (Exception e) {
            log.error("加载用户失败: {}", e.getMessage());
            sendUnauthorizedResponse(response, "加载用户信息失败");
            return;
        }

        if (userDetails == null) {
            sendUnauthorizedResponse(response, "用户不存在");
            return;
        }

        // 可选：再次校验 token 与 userDetails 匹配
        if (!JwtUtil.validateToken(jwt, userDetails)) {
            log.info("JWT 与用户信息不匹配或已过期");
            sendUnauthorizedResponse(response, "令牌与用户信息不匹配或已过期");
            return;
        }

        // 创建认证对象，包含用户详情和权限
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
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
