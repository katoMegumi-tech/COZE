package com.cqie.admin.util;

import com.cqie.admin.common.constant.JwtConstant;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.*;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Autowired
    private RedisUtil redisUtil;

    private static Key getSigningKey() {
        return Keys.hmacShaKeyFor(JwtConstant.SECRET.getBytes());
    }

    /**
     * 校验签名
     */
    public static boolean validateTokenSignatures(String token) {
        try {
            Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            // token 有效
        } catch (JwtException e) {
            // token 无效
            return false;
        }
        return true;
    }

    /**
     * 从令牌中提取用户名
     * @param token jwt
     * @return 用户名
     */
    public static String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * 从 JWT 令牌中提取过期时间
     * 
     * @param token JWT 令牌字符串
     * @return 令牌的过期时间
     */
    public static Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * 从 JWT 令牌中提取指定的声明信息
     * 
     * @param <T> 返回值类型
     * @param token JWT 令牌字符串
     * @param claimsResolver 用于从 Claims 中提取特定声明的函数式接口
     * @return 提取的声明值
     */
    public static <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * 解析 JWT 令牌并获取所有声明信息
     * 
     * @param token JWT 令牌字符串
     * @return Claims 对象，包含令牌中的所有声明数据
     */
    private static Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 检查 JWT 令牌是否已过期
     * 
     * @param token JWT 令牌字符串
     * @return true 表示令牌已过期，false 表示未过期
     */
    private static Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * 为用户名生成 JWT 令牌
     * 
     * @param username 用户名
     * @return 生成的 JWT 令牌字符串
     */
    public static String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }

    /**
     * 创建 JWT 令牌
     * 
     * @param claims 要包含在令牌中的声明映射
     * @param subject 令牌主题（通常为用户名）
     * @return 创建的 JWT 令牌字符串
     */
    private static String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setId(generateJti())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JwtConstant.EXPIRATION))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 验证 JWT 令牌是否有效
     * 
     * @param token JWT 令牌字符串
     * @param userDetails 用户详细信息对象
     * @return true 表示令牌有效且用户名匹配，false 表示无效
     */
    public static Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * 获取 JWT 令牌中的jti
     *
     * @param token JWT 令牌字符串
     * @return jti
     */
    public static String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    /**
     * 生成唯一的 JWT ID（jti）
     * jti 是 JWT 的唯一标识符，用于防止令牌重放攻击
     * 
     * @return 随机生成的 UUID 字符串
     */
    public static String generateJti() {
        return UUID.randomUUID().toString();
    }

    /**
     * 刷新令牌
     *
     * @param token JWT 令牌字符串
     * @return 刷新后的token
     */
    public String refreshToken(String token) {
        String username = extractUsername(token);
        String jti = extractJti(token);
        Date date = extractExpiration(token);
        long expirationDate = date.getTime() + JwtConstant.EXPIRATION * 7;

        redisUtil.setJti(username, jti, expirationDate);

        HashMap<String, String> claim = new HashMap<>();
        claim.put("username", username);
        return Jwts.builder()
                .setClaims(claim)
                .setSubject("username")
                .setId(jti)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(expirationDate))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 校验令牌
     */
    public boolean validateToken(String token) {

        return validateTokenSignatures(token)
                && !isTokenExpired(token)
                && Objects.equals(redisUtil.getJti(extractUsername(token)), extractJti(token));
    }

}
