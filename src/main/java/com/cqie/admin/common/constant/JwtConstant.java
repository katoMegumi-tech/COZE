package com.cqie.admin.common.constant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class JwtConstant {

    @Value("${jwt.secret:8f3hG@9kL#2mN$5pQ^7rT&1vW*yXzB4cD6eF}")
    private String secretValue;

    @Value("${jwt.expire:7200000}")
    private Long expirationValue;

    public static String SECRET;
    public static long EXPIRATION;

    @PostConstruct
    public void init() {
        SECRET = secretValue;
        EXPIRATION = expirationValue;
    }
}
