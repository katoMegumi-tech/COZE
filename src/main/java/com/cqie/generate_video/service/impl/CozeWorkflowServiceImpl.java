package com.cqie.generate_video.service.impl;

import com.cqie.admin.service.UserPointsLogService;
import com.cqie.generate_video.config.CozeConfig;
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

import static com.cqie.generate_video.constant.PointsConsumeEnum.VIDEO_GENERATION;

/**
 * Coze 工作流服务实现
 */
@Service
public class CozeWorkflowServiceImpl implements CozeWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(CozeWorkflowServiceImpl.class);
    
    private final CozeConfig cozeConfig;
    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
        private UserPointsLogService userPointsLogService;

    public CozeWorkflowServiceImpl(CozeConfig cozeConfig) {
        this.cozeConfig = cozeConfig;
        this.webClient = WebClient.builder()
                .baseUrl(cozeConfig.getBaseUrl())
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public CozeWorkflowResponse runWorkflow(CozeWorkflowRequest request) {

        String username = SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
        userPointsLogService.updateUserPoints(
                username,
                VIDEO_GENERATION.getPoints(),
                VIDEO_GENERATION.getDesc());


        // 使用配置文件中的 workflow_id
        String workflowId = cozeConfig.getWorkflowId();
        
        log.info("开始运行工作流，workflow_id: {}, file_id: {}, timeout: {} 分钟", 
            workflowId, request.getFileId(), cozeConfig.getTimeoutMinutes());

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
        Map<String, Object> params = new HashMap<>();
        
        // image 参数需要是 JSON 字符串格式: {"file_id":"xxx"}
        if (request.getFileId() != null) {
            try {
                Map<String, String> imageData = new HashMap<>();
                imageData.put("file_id", request.getFileId());
                String imageJson = objectMapper.writeValueAsString(imageData);
                params.put("image", imageJson);
            } catch (Exception e) {
                log.error("构建 image 参数失败", e);
                throw new RuntimeException("构建 image 参数失败", e);
            }
        }
        
        if (request.getProductName() != null) params.put("product_name", request.getProductName());
        if (request.getProductDesc() != null) params.put("product_desc", request.getProductDesc());
        if (request.getProductFeatures() != null) params.put("product_features", request.getProductFeatures());
        if (request.getProductPrice() != null) params.put("product_price", request.getProductPrice());
        
        // 设置默认值
        params.put("video_aspect_ratio", request.getVideoAspectRatio() != null ? request.getVideoAspectRatio() : "16:9");
        params.put("video_length", request.getVideoLength() != null ? request.getVideoLength() : 10);
        params.put("video_num", request.getVideoNum() != null ? request.getVideoNum() : 1);
        params.put("video_resolution", request.getVideoResolution() != null ? request.getVideoResolution() : "720P");
        // videoSubtitle 默认不传（无字幕）
        if (request.getVideoSubtitle() != null && request.getVideoSubtitle()) {
            params.put("video_subtitle", true);
        }
        
        if (request.getVideoScene() != null) params.put("video_scene", request.getVideoScene());
        if (request.getVideoStyle() != null) params.put("video_style", request.getVideoStyle());
        
        log.info("========== 传给 Coze 工作流的参数 ==========");
        params.forEach((key, value) -> log.info("{}: {}", key, value));
        log.info("==========================================");
        
        return params;
    }
}