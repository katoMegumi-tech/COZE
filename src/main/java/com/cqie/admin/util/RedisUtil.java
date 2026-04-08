package com.cqie.admin.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisUtil {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final String JTI = "jti:login";

    /**
     * 存储jti
     * @param jti jti
     * @param username 用户名
     * @param expiration 过期时间
     */
    public void setJti(String jti, String username, long expiration) {
        redisTemplate.opsForValue().set(JTI + ":" + username, jti, expiration, TimeUnit.MINUTES);
    }

    /**
     * 获取jti
     * @param username 用户名
     * @return 获取到的jti值
 }
     */
    public String getJti(String username) {
        return redisTemplate.opsForValue().get(JTI + ":" + username);
    }

    /**
     * 登出时删除jti
     */
    public boolean deleteJti(String username) {
        Boolean delete = redisTemplate.delete(JTI + ":" + username);
        return Boolean.TRUE.equals(delete);
    }

    /**
     * 刷新jti的过期时间
     */
    public void refreshJtiExpiration(String username, long expiration) {
        redisTemplate.expire(JTI + ":" + username, expiration, TimeUnit.SECONDS);
    }
}
