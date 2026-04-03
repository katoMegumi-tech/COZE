package com.cqie.admin.common.constant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class JwtConstant {

    @Value("${jwt.secret}")
    private String secretValue;

    @Value("${jwt.expire}")
    private Long expirationValue;

    public static String SECRET;
    public static long EXPIRATION;

    @PostConstruct
    public void init() {
        SECRET = secretValue;
        EXPIRATION = expirationValue;
    }
}
