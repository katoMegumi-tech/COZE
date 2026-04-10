package com.cqie.generate_video.service.impl;

import com.cqie.generate_video.config.CozeConfig;
import com.cqie.generate_video.dto.request.CozeWorkflowRequest;
import com.cqie.generate_video.dto.response.CozeWorkflowResponse;
import com.cqie.generate_video.service.CozeWorkflowService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Coze 工作流服务实现
 */
@Service
public class CozeWorkflowServiceImpl implements CozeWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(CozeWorkflowServiceImpl.class);

    private final CozeConfig cozeConfig;
    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CozeWorkflowServiceImpl(CozeConfig cozeConfig) {
        this.cozeConfig = cozeConfig;
        this.webClient = WebClient.builder()
                .baseUrl(cozeConfig.getBaseUrl())
                .build();
    }

    @Override
    public CozeWorkflowResponse runWorkflow(CozeWorkflowRequest request) {

        String workflowId = cozeConfig.getWorkflowId();
        log.info("开始异步运行工作流，workflow_id: {}", workflowId);

        Map<String, Object> parameters = buildParameters(request);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("workflow_id", workflowId);
        requestBody.put("parameters", parameters);
        requestBody.put("is_async", true);

        CozeWorkflowResponse response = new CozeWorkflowResponse();
        CozeWorkflowResponse.WorkflowData workflowData = new CozeWorkflowResponse.WorkflowData();
        StringBuilder debugBuilder = new StringBuilder();

        try {
            JsonNode runResp = webClient.post()
                    .uri("/v1/workflow/run")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + cozeConfig.getToken())
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(30));

            debugBuilder.append("run_response=").append(runResp).append("\n");

            if (runResp == null) {
                throw new RuntimeException("Coze run 接口返回为空");
            }
            if (runResp.path("code").asInt(-1) != 0) {
                throw new RuntimeException("Coze run 接口失败: " + runResp.path("msg").asText("unknown")
                        + ", run_response=" + runResp);
            }

            String executeId = extractExecuteId(runResp);
            if (executeId == null || executeId.isEmpty()) {
                throw new RuntimeException("Coze run 接口未返回 execute_id, run_response=" + runResp);
            }

            log.info("异步任务已提交，execute_id={}", executeId);
            pollRunHistoryUntilDone(workflowId, executeId, workflowData, debugBuilder);

            if (workflowData.getVideoUrls() != null && !workflowData.getVideoUrls().isEmpty()) {
                workflowData.setFirstVideoUrl(workflowData.getVideoUrls().get(0));
            }

            response.setCode(0);
            response.setMessage("SUCCESS");
            if (workflowData.getStatus() == null) {
                workflowData.setStatus("COMPLETED");
            }

            log.info("工作流执行成功，生成 {} 个视频",
                    workflowData.getVideoUrls() != null ? workflowData.getVideoUrls().size() : 0);
        } catch (WebClientResponseException e) {
            log.error("调用 Coze API 失败：{}", e.getStatusCode(), e);
            response.setCode(500);
            response.setMessage("调用 Coze API 失败：" + e.getStatusCode());
            workflowData.setStatus("FAILED");
            workflowData.setErrorMessage(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("调用异常：{}", e.getMessage(), e);
            response.setCode(500);
            response.setMessage("调用异常：" + e.getMessage());
            workflowData.setStatus("FAILED");
            workflowData.setErrorMessage(e.getMessage());
        }

        workflowData.setDebugData(debugBuilder.toString());
        response.setData(workflowData);
        return response;
    }

    private String extractExecuteId(JsonNode runResp) {
        // Coze async run 官方返回：execute_id 位于顶层
        String id = runResp.path("execute_id").asText(null);
        if (id != null && !id.isEmpty() && !"null".equalsIgnoreCase(id)) {
            return id;
        }

        // 兼容历史/其他结构
        id = runResp.path("data").path("execute_id").asText(null);
        if (id != null && !id.isEmpty() && !"null".equalsIgnoreCase(id)) {
            return id;
        }

        JsonNode data = runResp.path("data");
        if (data.isArray() && !data.isEmpty()) {
            id = data.get(0).path("execute_id").asText(null);
            if (id != null && !id.isEmpty() && !"null".equalsIgnoreCase(id)) {
                return id;
            }
        }

        return null;
    }

    private void pollRunHistoryUntilDone(String workflowId, String executeId,
            CozeWorkflowResponse.WorkflowData workflowData, StringBuilder debugBuilder) throws Exception {

        long intervalMillis = 2000L;

        while (true) {
            JsonNode historyResp = webClient.get()
                    .uri("/v1/workflows/{workflow_id}/run_histories/{execute_id}", workflowId, executeId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + cozeConfig.getToken())
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(Duration.ofSeconds(30));

            debugBuilder.append("history_response@")
                    .append(Instant.now().getEpochSecond())
                    .append("=")
                    .append(historyResp)
                    .append("\n");

            if (historyResp == null) {
                Thread.sleep(intervalMillis);
                continue;
            }

            if (historyResp.path("code").asInt(-1) != 0) {
                String msg = historyResp.path("msg").asText("unknown");
                throw new RuntimeException("Coze history 接口失败: " + msg);
            }

            JsonNode dataArr = historyResp.path("data");
            if (!dataArr.isArray() || dataArr.isEmpty()) {
                Thread.sleep(intervalMillis);
                continue;
            }

            JsonNode history = dataArr.get(0);
            String debugUrl = history.path("debug_url").asText("");
            // 只在第一次获取到时存储，不打印日志
            if (!debugUrl.isEmpty() && (workflowData.getDebugUrl() == null || workflowData.getDebugUrl().isEmpty())) {
                workflowData.setDebugUrl(debugUrl);
            }

            String status = history.path("execute_status").asText("");

            if ("Running".equalsIgnoreCase(status)) {
                workflowData.setStatus("RUNNING");
                Thread.sleep(intervalMillis);
                continue;
            }

            if ("Fail".equalsIgnoreCase(status)) {
                String err = history.path("error_message").asText("工作流执行失败");
                workflowData.setStatus("FAILED");
                workflowData.setErrorMessage(err);
                throw new RuntimeException(err);
            }

            if ("Success".equalsIgnoreCase(status)) {
                parseOutputToVideoUrls(history.path("output").asText(""), workflowData);
                workflowData.setStatus("COMPLETED");
                return;
            }

            Thread.sleep(intervalMillis);
        }
    }

    private void parseOutputToVideoUrls(String outputText, CozeWorkflowResponse.WorkflowData workflowData) {
        if (outputText == null || outputText.trim().isEmpty()) {
            return;
        }

        try {
            JsonNode outputRoot = objectMapper.readTree(outputText);

            JsonNode outputNode = outputRoot.path("Output");
            if (!outputNode.isMissingNode()) {
                if (outputNode.isTextual()) {
                    tryExtractVideoFromTextJson(outputNode.asText(), workflowData);
                } else {
                    tryExtractVideoFromNode(outputNode, workflowData);
                }
            }

            outputRoot.fields().forEachRemaining(entry -> {
                JsonNode node = entry.getValue();
                if (node.isTextual()) {
                    tryExtractVideoFromTextJson(node.asText(), workflowData);
                } else {
                    tryExtractVideoFromNode(node, workflowData);
                }
            });
        } catch (Exception e) {
            log.warn("解析 output 失败: {}", e.getMessage());
        }
    }

    private void tryExtractVideoFromTextJson(String text, CozeWorkflowResponse.WorkflowData workflowData) {
        if (text == null || text.trim().isEmpty()) {
            return;
        }

        try {
            JsonNode node = objectMapper.readTree(text);
            tryExtractVideoFromNode(node, workflowData);
        } catch (Exception ignore) {
        }
    }

    private void tryExtractVideoFromNode(JsonNode node, CozeWorkflowResponse.WorkflowData workflowData) {
        if (node == null || node.isNull()) {
            return;
        }

        JsonNode videoNode = node.get("video");
        if (videoNode == null) {
            videoNode = node.get("video_url");
        }

        if (videoNode != null) {
            if (workflowData.getVideoUrls() == null) {
                workflowData.setVideoUrls(new ArrayList<>());
            }

            if (videoNode.isTextual()) {
                String url = videoNode.asText();
                if (!url.isEmpty()) {
                    addVideoUrl(workflowData, url);
                }
            } else if (videoNode.isArray()) {
                for (JsonNode v : videoNode) {
                    String url = v.asText();
                    if (!url.isEmpty()) {
                        addVideoUrl(workflowData, url);
                    }
                }
            }
        }

        if (node.isObject()) {
            node.fields().forEachRemaining(e -> tryExtractVideoFromNode(e.getValue(), workflowData));
        } else if (node.isArray()) {
            node.forEach(n -> tryExtractVideoFromNode(n, workflowData));
        } else if (node.isTextual()) {
            String text = node.asText();
            if (text.startsWith("http://") || text.startsWith("https://")) {
                if (workflowData.getVideoUrls() == null) {
                    workflowData.setVideoUrls(new ArrayList<>());
                }
                addVideoUrl(workflowData, text);
            }
        }
    }

    private void addVideoUrl(CozeWorkflowResponse.WorkflowData workflowData, String url) {
        if (workflowData.getVideoUrls().contains(url)) {
            return;
        }

        workflowData.getVideoUrls().add(url);
        log.info("获取到视频 URL: {}", url);
    }

    /**
     * 构建工作流参数
     */
    private Map<String, Object> buildParameters(CozeWorkflowRequest request) {
        // 1. 将 request 对象转为 Map（驼峰转下划线，如 gearSelection -> gear_selection）
        ObjectMapper mapper = new ObjectMapper();
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        Map<String, Object> params = mapper.convertValue(request, new TypeReference<Map<String, Object>>() {});

        // 2. 特殊处理 images 字段：URL 直接保留，file_id 包装为 JSON 字符串
        if (params.containsKey("images")) {
            List<?> rawImages = (List<?>) params.get("images");
            if (rawImages != null && !rawImages.isEmpty()) {
                List<String> processedImages = new ArrayList<>();
                for (Object item : rawImages) {
                    String str = item.toString();
                    if (str.startsWith("http://") || str.startsWith("https://")) {
                        processedImages.add(str);
                    } else {
                        processedImages.add("{\"file_id\": \"" + str + "\"}");
                    }
                }
                params.put("images", processedImages);
            } else {
                params.put("images", new ArrayList<>());
            }
        } else {
            params.put("images", new ArrayList<>());
        }

        // 3. 特殊处理 videos：确保是 List<String> 且不为 null
        if (params.containsKey("videos")) {
            List<?> rawVideos = (List<?>) params.get("videos");
            if (rawVideos != null && !rawVideos.isEmpty()) {
                List<String> processedVideos = new ArrayList<>();
                for (Object item : rawVideos) {
                    String str = item.toString();
                    if (str.startsWith("http://") || str.startsWith("https://")) {
                        processedVideos.add(str);
                    } else {
                        processedVideos.add("{\"file_id\": \"" + str + "\"}");
                    }
                }
                params.put("videos", processedVideos);
            } else {
                params.put("videos", new ArrayList<>());
            }
        } else {
            params.put("videos", new ArrayList<>());
        }

        // 4. 设置默认值（针对可能为 null 的字段）
        params.putIfAbsent("gear_selection", "std");
        params.putIfAbsent("video_aspect_ratio", "16:9");
        params.putIfAbsent("video_length", 10);

        // 5. 日志输出
        log.info("========== 传给 Coze 工作流的参数 ==========");
        params.forEach((key, value) -> log.info("{}: {}", key, value));
        log.info("==========================================");

        return params;
    }
}

