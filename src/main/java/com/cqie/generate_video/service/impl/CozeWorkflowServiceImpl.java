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
        
        log.info("开始运行工作流，workflow_id: {}, gear_selection: {}, timeout: {} 分钟", 
            workflowId, request.getGearSelection(), cozeConfig.getTimeoutMinutes());

        Map<String, Object> parameters = buildParameters(request);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("workflow_id", workflowId);
        requestBody.put("parameters", parameters);

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
                    .blockLast(Duration.ofMinutes(cozeConfig.getTimeoutMinutes()));

        } catch (WebClientResponseException e) {
            log.error("调用 Coze API 失败：{}", e.getStatusCode(), e);
            throw new RuntimeException("调用 Coze API 失败：" + e.getStatusCode(), e);
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
            log.info("工作流执行成功，生成 {} 个视频", 
                workflowData.getVideoUrls() != null ? workflowData.getVideoUrls().size() : 0);
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

                    JsonNode contentJson = objectMapper.readTree(content);
                    JsonNode videoNode = contentJson.get("video");

                    if (videoNode != null) {
                        if (workflowData.getVideoUrls() == null) {
                            workflowData.setVideoUrls(new ArrayList<>());
                        }

                        // video: string
                        if (videoNode.isTextual()) {
                            String url = videoNode.asText();
                            if (!url.isEmpty()) {
                                workflowData.getVideoUrls().add(url);
                                log.info("获取到视频 URL: {}", url);
                            }
                        }
                        // video: array
                        else if (videoNode.isArray()) {
                            for (JsonNode v : videoNode) {
                                String url = v.asText();
                                if (!url.isEmpty()) {
                                    workflowData.getVideoUrls().add(url);
                                    log.info("获取到视频 URL: {}", url);
                                }
                            }
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
     * 构建工作流参数
     */
    private Map<String, Object> buildParameters(CozeWorkflowRequest request) {
        Map<String, Object> input = new LinkedHashMap<>();
        
        // 档位选择
        input.put("gear_selection", request.getGearSelection() != null ? request.getGearSelection() : "std");
        
        // 图片列表 - 转换为 <#file:url#> 格式
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<String> imageFiles = request.getImages().stream()
                .map(url -> "<#file:" + url + "#>")
                .collect(Collectors.toList());
            input.put("images", imageFiles);
        } else {
            input.put("images", new ArrayList<>());
        }
        
        // 视频列表 - 转换为 <#file:id#> 格式
        if (request.getVideos() != null && !request.getVideos().isEmpty()) {
            List<String> videoFiles = request.getVideos().stream()
                .map(video -> "<#file:" + video.getId() + "#>")
                .collect(Collectors.toList());
            input.put("videos", videoFiles);
        } else {
            input.put("videos", new ArrayList<>());
        }
        
        // 产品信息
        if (request.getProductName() != null) input.put("product_name", request.getProductName());
        if (request.getProductDesc() != null) input.put("product_desc", request.getProductDesc());
        if (request.getProductFeatures() != null) input.put("product_features", request.getProductFeatures());
        if (request.getProductPrice() != null) input.put("product_price", request.getProductPrice());
        
        // 视频参数
        input.put("video_aspect_ratio", request.getVideoAspectRatio() != null ? request.getVideoAspectRatio() : "16:9");
        input.put("video_length", request.getVideoLength() != null ? request.getVideoLength() : 10);
        if (request.getVideoScene() != null) input.put("video_scene", request.getVideoScene());
        if (request.getVideoStyle() != null) input.put("video_style", request.getVideoStyle());
        
        // 构建最终参数，包装在 _input 中
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("_input", input);
        
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