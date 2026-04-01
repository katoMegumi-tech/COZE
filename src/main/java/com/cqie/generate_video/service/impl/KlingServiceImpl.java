package com.cqie.generate_video.service.impl;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.cqie.generate_video.config.KlingConfig;
import com.cqie.generate_video.dto.request.KlingTaskRequest;
import com.cqie.generate_video.dto.response.KlingTaskResponse;
import com.cqie.generate_video.service.KlingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * Kling AI 视频生成服务实现
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KlingServiceImpl implements KlingService {

    private final KlingConfig klingConfig;
    private final ObjectMapper objectMapper;

    @Override
    public KlingTaskResponse createVideoTask(KlingTaskRequest request) {
        try {
            String token = generateApiToken(klingConfig.getAccessKey(), klingConfig.getSecretKey());
            String jsonBody = objectMapper.writeValueAsString(request);

            log.info("Kling API Token generated successfully.");
            log.debug("Kling API request body: {}", jsonBody);

            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpPost httpPost = new HttpPost(klingConfig.getBaseUrl());
                httpPost.setHeader("Authorization", "Bearer " + token);
                httpPost.setHeader("Content-Type", "application/json; charset=UTF-8");
                httpPost.setEntity(new StringEntity(jsonBody, StandardCharsets.UTF_8));

                try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                    String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                    log.debug("Kling API response body: {}", responseBody);
                    return objectMapper.readValue(responseBody, KlingTaskResponse.class);
                }
            }
        } catch (Exception e) {
            log.error("Failed to create Kling video task", e);
            KlingTaskResponse errorResponse = new KlingTaskResponse();
            errorResponse.setCode(-1);
            errorResponse.setMessage(e.getMessage());
            return errorResponse;
        }
    }

    @Override
    public KlingTaskResponse queryTaskStatus(String taskId) {
        try {
            String token = generateApiToken(klingConfig.getAccessKey(), klingConfig.getSecretKey());
            String url = klingConfig.getBaseUrl() + "/" + taskId;

            log.info("Querying Kling task status for task_id: {}", taskId);

            try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
                HttpGet httpGet = new HttpGet(url);
                httpGet.setHeader("Authorization", "Bearer " + token);
                httpGet.setHeader("Content-Type", "application/json; charset=UTF-8");

                try (CloseableHttpResponse response = httpClient.execute(httpGet)) {
                    String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                    log.debug("Kling API query response body: {}", responseBody);
                    return objectMapper.readValue(responseBody, KlingTaskResponse.class);
                }
            }
        } catch (Exception e) {
            log.error("Failed to query Kling task status", e);
            KlingTaskResponse errorResponse = new KlingTaskResponse();
            errorResponse.setCode(-1);
            errorResponse.setMessage(e.getMessage());
            return errorResponse;
        }
    }

    private String generateApiToken(String ak, String sk) {
        Date now = new Date();
        Date expiredAt = new Date(now.getTime() + klingConfig.getTokenExpireSeconds() * 1000);
        Date notBefore = new Date(now.getTime() - 5000);
        Algorithm algorithm = Algorithm.HMAC256(sk);
        return JWT.create()
                .withIssuer(ak)
                .withHeader(Map.of("alg", "HS256"))
                .withExpiresAt(expiredAt)
                .withNotBefore(notBefore)
                .sign(algorithm);
    }
}
