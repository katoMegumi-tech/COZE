package com.cqie.generate_video.service.impl;

import com.cqie.admin.common.exception.ClientException;
import com.cqie.admin.service.UserPointsLogService;
import com.cqie.generate_video.config.CozeConfig;
import com.cqie.generate_video.constant.PointsConsumeEnum;
import com.cqie.generate_video.dto.request.CozeWorkflowRequest;
import com.cqie.generate_video.dto.response.CozeWorkflowResponse;
import com.cqie.generate_video.service.CozeWorkflowService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * Coze 工作流服务实现
 */
@Service
public class CozeWorkflowServiceImpl implements CozeWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(CozeWorkflowServiceImpl.class);
    
    private final CozeConfig cozeConfig;
    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserPointsLogService userPointsLogService;

    public CozeWorkflowServiceImpl(CozeConfig cozeConfig, UserPointsLogService userPointsLogService) {
        this.cozeConfig = cozeConfig;
        this.userPointsLogService = userPointsLogService;
        this.webClient = WebClient.builder()
                .baseUrl(cozeConfig.getBaseUrl())
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public CozeWorkflowResponse runWorkflow(CozeWorkflowRequest request) {

        // 使用配置文件中的 workflow_id
        String workflowId = cozeConfig.getWorkflowId();

        // 获取超时时间，确保有默认值
        int timeoutMinutes = cozeConfig.getTimeoutMinutes();

        log.info("开始运行工作流，workflow_id: {}, gearSelection: {}, productName: {}, timeout: {} 分钟",
            workflowId, request.getGearSelection(), request.getProductName(), timeoutMinutes);

        Map<String, Object> parameters = buildParameters(request);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("workflow_id", workflowId);
        requestBody.put("parameters", parameters);

        // 打印完整请求体
        try {
            log.info("========== Coze API 请求体 ==========");
            log.info(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(requestBody));
            log.info("======================================");
        } catch (Exception e) {
            log.warn("请求体序列化失败", e);
        }

        StringBuilder fullResponseBuilder = new StringBuilder();
        AtomicReference<String> doneData = new AtomicReference<>();
        AtomicReference<String> errorData = new AtomicReference<>();
        AtomicReference<Boolean> hasMessage = new AtomicReference<>(false);

        CozeWorkflowResponse response = new CozeWorkflowResponse();
        CozeWorkflowResponse.WorkflowData workflowData = new CozeWorkflowResponse.WorkflowData();

        try {
            Flux<String> stream = webClient.post()
                    .uri("/v1/workflow/stream_run")
                    .header("Authorization", "Bearer " + cozeConfig.getToken())
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToFlux(String.class);

            stream
                    .doOnNext(chunk -> {
                        if (chunk != null && !chunk.trim().isEmpty()) {
                            fullResponseBuilder.append(chunk).append("\n");
                        }
                        parseSseChunk(chunk, doneData, errorData, hasMessage, workflowData);
                    })
                    .doOnError(e -> log.error("SSE 流错误：{}", e.getMessage()))
                    .blockLast(Duration.ofMinutes(timeoutMinutes));

        } catch (WebClientResponseException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("调用 Coze API 失败，状态码: {}，响应: {}", e.getStatusCode(), errorBody, e);
            throw new RuntimeException("调用 Coze API 失败：" + e.getStatusCode() + "，" + errorBody, e);
        } catch (Exception e) {
            log.error("调用异常：{}", e.getMessage(), e);
            throw new RuntimeException("调用异常：" + e.getMessage(), e);
        }

        // 设置调试数据
        workflowData.setDebugData(fullResponseBuilder.toString());

        // 赋值 firstVideoUrl
        if (workflowData.getVideoUrls() != null && !workflowData.getVideoUrls().isEmpty()) {
            workflowData.setFirstVideoUrl(workflowData.getVideoUrls().get(0));
        }

        // 处理结果
        if (errorData.get() != null) {
            response.setCode(500);
            response.setMessage(errorData.get());
            workflowData.setStatus("FAILED");
            workflowData.setErrorMessage(errorData.get());
            log.error("工作流执行失败：{}", errorData.get());
        } else {
            response.setCode(0);
            response.setMessage("SUCCESS");
            workflowData.setStatus(hasMessage.get() ? "COMPLETED" : "NO_RESPONSE");
            int videoCount = workflowData.getVideoUrls() != null ? workflowData.getVideoUrls().size() : 0;
            log.info("工作流执行成功，生成 {} 个视频", videoCount);
            if (videoCount == 0) {
                log.warn("未提取到视频 URL，完整响应内容：\n{}", fullResponseBuilder.toString());
            }
        }

        response.setData(workflowData);
        return response;
    }

    /**
     * 解析 SSE 流数据
     */
    private void parseSseChunk(String chunk,
                               AtomicReference<String> doneData,
                               AtomicReference<String> errorData,
                               AtomicReference<Boolean> hasMessage,
                               CozeWorkflowResponse.WorkflowData workflowData) {

        if (chunk == null || chunk.trim().isEmpty()) return;

        String[] lines = chunk.split("\n");

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;

            // 兼容 SSE: data: 前缀
            if (line.startsWith("data:")) {
                line = line.substring(5).trim();
            }

            try {
                JsonNode jsonNode = objectMapper.readTree(line);

                // 错误处理
                if (jsonNode.has("error_message")) {
                    errorData.set(jsonNode.get("error_message").asText());
                    continue;
                }

                // 解析 content
                if (jsonNode.has("content")) {
                    String content = jsonNode.get("content").asText();
                    hasMessage.set(true);

                    if (content == null || content.equals("{}")) continue;

                    log.debug("解析 content: {}", content);

                    try {
                        JsonNode contentJson = objectMapper.readTree(content);

                        // 尝试从 result 字段获取视频 URL（Coze 工作流返回格式）
                        JsonNode resultNode = contentJson.get("result");
                        if (resultNode != null && resultNode.isArray()) {
                            if (workflowData.getVideoUrls() == null) {
                                workflowData.setVideoUrls(new ArrayList<>());
                            }
                            for (JsonNode urlNode : resultNode) {
                                String url = urlNode.asText();
                                if (!url.isEmpty()) {
                                    workflowData.getVideoUrls().add(url);
                                    log.info("从 result 获取到视频 URL: {}", url);
                                }
                            }
                        }

                        // 兼容 video/videos 字段
                        JsonNode videoNode = contentJson.get("video");
                        if (videoNode != null) {
                            addVideoUrls(videoNode, workflowData, "video");
                        }
                        JsonNode videosNode = contentJson.get("videos");
                        if (videosNode != null) {
                            addVideoUrls(videosNode, workflowData, "videos");
                        }

                        // 如果 content 本身是 URL（直接返回视频链接）
                        if (content.startsWith("http") && (workflowData.getVideoUrls() == null || workflowData.getVideoUrls().isEmpty())) {
                            if (workflowData.getVideoUrls() == null) {
                                workflowData.setVideoUrls(new ArrayList<>());
                            }
                            workflowData.getVideoUrls().add(content);
                            log.info("从 content 直接获取到视频 URL: {}", content);
                        }
                    } catch (Exception e) {
                        log.warn("解析 content JSON 失败: {}, 错误: {}", content, e.getMessage());
                        // 如果 content 不是 JSON，可能是直接的 URL
                        if (content.startsWith("http")) {
                            if (workflowData.getVideoUrls() == null) {
                                workflowData.setVideoUrls(new ArrayList<>());
                            }
                            workflowData.getVideoUrls().add(content);
                            log.info("从 content 获取到视频 URL: {}", content);
                        }
                    }
                }

                // 结束节点
                if (jsonNode.has("node_is_finish") && jsonNode.get("node_is_finish").asBoolean()) {
                    log.debug("节点执行完成");
                }

            } catch (Exception e) {
                log.warn("JSON 解析失败: {}", line);
            }
        }
    }

    /**
     * 添加视频 URL 到列表（辅助方法）
     */
    private void addVideoUrls(JsonNode node, CozeWorkflowResponse.WorkflowData workflowData, String fieldName) {
        if (workflowData.getVideoUrls() == null) {
            workflowData.setVideoUrls(new ArrayList<>());
        }

        // 字符串类型
        if (node.isTextual()) {
            String url = node.asText();
            if (!url.isEmpty()) {
                workflowData.getVideoUrls().add(url);
                log.info("从 {} 字段获取到视频 URL: {}", fieldName, url);
            }
        }
        // 数组类型
        else if (node.isArray()) {
            for (JsonNode v : node) {
                String url = v.asText();
                if (!url.isEmpty()) {
                    workflowData.getVideoUrls().add(url);
                    log.info("从 {} 数组获取到视频 URL: {}", fieldName, url);
                }
            }
        }
    }

    /**
     * 构建工作流参数
     */
    private Map<String, Object> buildParameters(CozeWorkflowRequest request) {
        Map<String, Object> params = new LinkedHashMap<>();

        // 档位选择
        params.put("gear_selection", request.getGearSelection() != null ? request.getGearSelection() : "std");

        // 图片列表 - 直接使用原始 URL（与官网示例保持一致）
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<String> imageParams = new ArrayList<>();
            for (String imageId : request.getImages()) {
                // 注意转义双引号，实际字符串内容是 {"file_id": "7625842253768032298"}
                imageParams.add("{\"file_id\": \"" + imageId + "\"}");
            }
            params.put("images", imageParams);
        } else {
            params.put("images", new ArrayList<>());
        }

        // 视频列表 - 直接使用原始 URL
        if (request.getVideos() != null && !request.getVideos().isEmpty()) {
            List<String> videoParams = new ArrayList<>();
            for (String videoId : request.getVideos()) {
                videoParams.add("{\"file_id\": \"" + videoId + "\"}");
            }
            params.put("videos", videoParams);
        } else {
            params.put("videos", new ArrayList<>());
        }

        // 产品信息
        if (request.getProductName() != null) params.put("product_name", request.getProductName());
        if (request.getProductDesc() != null) params.put("product_desc", request.getProductDesc());
        if (request.getProductFeatures() != null) params.put("product_features", request.getProductFeatures());
        if (request.getProductPrice() != null) params.put("product_price", request.getProductPrice());

        // 视频参数
        params.put("video_aspect_ratio", request.getVideoAspectRatio() != null ? request.getVideoAspectRatio() : "16:9");
        params.put("video_length", request.getVideoLength() != null ? request.getVideoLength() : 10);
        if (request.getVideoScene() != null) params.put("video_scene", request.getVideoScene());
        if (request.getVideoStyle() != null) params.put("video_style", request.getVideoStyle());

        // 新增参数
        if (request.getVideoNum() != null) params.put("video_num", request.getVideoNum());
        if (request.getVideoResolution() != null) params.put("video_resolution", request.getVideoResolution());
        if (request.getVideoSubtitle() != null) params.put("video_subtitle", request.getVideoSubtitle());

        log.info("========== 传给 Coze 工作流的参数 ==========");
        try {
            log.info(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(params));
        } catch (Exception e) {
            log.warn("参数序列化失败", e);
        }
        log.info("==========================================");

        return params;
    }
}