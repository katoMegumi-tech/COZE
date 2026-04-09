package com.cqie.generate_video.service.impl;

import com.cqie.admin.service.UserPointsLogService;
import com.cqie.generate_video.config.CozeConfig;
import com.cqie.generate_video.dto.request.CopywritingRequest;
import com.cqie.generate_video.dto.response.CopywritingResponse;
import com.cqie.generate_video.service.CopywritingService;
import com.cqie.generate_video.service.TaskManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 文案生成服务实现
 */
@Service
public class CopywritingServiceImpl implements CopywritingService {
    
    private static final Logger log = LoggerFactory.getLogger(CopywritingServiceImpl.class);
    
    private final CozeConfig cozeConfig;
    private final WebClient webClient;
    private final TaskManager taskManager;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserPointsLogService userPointsLogService;


    public CopywritingServiceImpl(CozeConfig cozeConfig, TaskManager taskManager) {
        this.cozeConfig = cozeConfig;
        this.taskManager = taskManager;
        this.webClient = WebClient.builder()
                .baseUrl(cozeConfig.getBaseUrl())
                .build();
    }

    @Transactional(rollbackFor = Exception.class)
    @Override
    public CopywritingResponse generateCopywriting(CopywritingRequest request) {
        return executeCopywritingGeneration(request);
    }
    
    /**
     * 执行文案生成逻辑（支持异步调用）
     * @param request 请求参数
     * @return 生成结果
     */
    private CopywritingResponse executeCopywritingGeneration(CopywritingRequest request) {
    
        log.info("开始生成文案，产品名称：{}", request.getProductServiceName());
        
        Map<String, Object> parameters = buildParameters(request);
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("workflow_id", cozeConfig.getCopywritingWorkflowId());
        requestBody.put("parameters", parameters);
        
        StringBuilder fullResponseBuilder = new StringBuilder();
        AtomicReference<String> contentData = new AtomicReference<>("");
        AtomicReference<String> errorData = new AtomicReference<>();
        
        CopywritingResponse response = new CopywritingResponse();
        
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
                        parseSseChunk(chunk, contentData, errorData);
                    })
                    .doOnError(e -> log.error("SSE 流错误：{}", e.getMessage()))
                    .blockLast(Duration.ofMinutes(5)); // 5 分钟超时
            
        } catch (Exception e) {
            log.error("调用 Coze API 失败", e);
            response.setStatus("FAILED");
            response.setErrorMessage("调用失败：" + e.getMessage());
            return response;
        }
        
        // 设置调试数据
        response.setDebugData(fullResponseBuilder.toString());
        
        // 解析 output 链接
        try {
            String fullResponse = fullResponseBuilder.toString();
            String[] lines = fullResponse.split("\n");
            
            // 查找 node_type 为 End 的节点
            for (int i = lines.length - 1; i >= 0; i--) {
                String line = lines[i].trim();
                if (line.startsWith("data:")) {
                    line = line.substring(5).trim();
                }
                if (line.isEmpty() || line.equals("[DONE]")) continue;
                
                try {
                    JsonNode jsonNode = objectMapper.readTree(line);
                    
                    // 查找 node_type 为 End 的节点
                    if (jsonNode.has("node_type") && "End".equals(jsonNode.get("node_type").asText())) {
                        if (jsonNode.has("content")) {
                            String contentStr = jsonNode.get("content").asText();
                            JsonNode contentJson = objectMapper.readTree(contentStr);
                            
                            // 提取 output 链接（直接返回原始链接）
                            if (contentJson.has("output") && contentJson.get("output").isArray()) {
                                List<String> links = new ArrayList<>();
                                for (JsonNode link : contentJson.get("output")) {
                                    String url = link.asText();
                                    links.add(url);
                                    log.info("提取链接：{}", url);
                                }
                                response.setOutputLinks(links);
                                log.info("提取到 {} 个链接", links.size());
                            }
                            break;
                        }
                    }
                } catch (Exception e) {
                    // 跳过无效行
                }
            }
        } catch (Exception e) {
            log.warn("解析 output 链接失败", e);
        }
        
        // 处理结果
        if (errorData.get() != null) {
            response.setStatus("FAILED");
            response.setErrorMessage(errorData.get());
            log.error("文案生成失败：{}", errorData.get());
        } else if (contentData.get() != null && !contentData.get().isEmpty()) {
            response.setStatus("SUCCESS");
            response.setContent(contentData.get());
            log.info("文案生成成功，内容长度：{}", contentData.get().length());
        } else {
            response.setStatus("FAILED");
            response.setErrorMessage("未能提取到文案内容");
            log.error("未能提取到文案内容");
        }
        
        return response;
    }
    
    /**
     * 解析 SSE 流数据
     */
    private void parseSseChunk(String chunk, 
                               AtomicReference<String> contentData,
                               AtomicReference<String> errorData) {
        if (chunk == null || chunk.trim().isEmpty()) return;
        
        String[] lines = chunk.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty()) continue;
            
            // 兼容 SSE: data: 前缀
            if (line.startsWith("data:")) {
                line = line.substring(5).trim();
            }
            
            if (line.equals("[DONE]")) continue;
            
            try {
                JsonNode jsonNode = objectMapper.readTree(line);
                
                // 错误处理
                if (jsonNode.has("error_message")) {
                    errorData.set(jsonNode.get("error_message").asText());
                    log.error("收到错误消息: {}", errorData.get());
                    continue;
                }
                
                // 只处理 node_type 为 End 的节点
                if (jsonNode.has("node_type") && "End".equals(jsonNode.get("node_type").asText())) {
                    if (jsonNode.has("content")) {
                        String content = jsonNode.get("content").asText();
                        if (content != null && !content.equals("{}")) {
                            try {
                                JsonNode contentJson = objectMapper.readTree(content);
                                
                                // 提取 Group1 字段（文案内容）
                                if (contentJson.has("Group1")) {
                                    String group1 = contentJson.get("Group1").asText();
                                    // 处理转义字符
                                    group1 = group1.replace("\\n", "\n");
                                    contentData.set(group1);
                                    log.info("成功提取 Group1 内容，长度: {}", group1.length());
                                }
                            } catch (Exception e) {
                                log.error("解析End节点content失败", e);
                            }
                        }
                    }
                }
                
            } catch (Exception e) {
                // 忽略解析失败的行
            }
        }
    }
    
    /**
     * 构建工作流参数
     */
    private Map<String, Object> buildParameters(CopywritingRequest request) {
        Map<String, Object> params = new HashMap<>();
        
        // 处理文件ID列表（图片）- 统一使用数组格式
        if (request.getFileIds() != null && !request.getFileIds().isEmpty()) {
            try {
                List<Map<String, String>> imageList = new ArrayList<>();
                for (String fileId : request.getFileIds()) {
                    Map<String, String> imageData = new HashMap<>();
                    imageData.put("file_id", fileId);
                    imageList.add(imageData);
                }
                // 转换为JSON数组字符串
                String imageArrayJson = objectMapper.writeValueAsString(imageList);
                // 尝试使用 images 作为参数名（复数形式）
                params.put("images", imageArrayJson);
                log.info("构建图片参数（{}张）: {}", imageList.size(), imageArrayJson);
            } catch (Exception e) {
                log.error("构建图片参数失败", e);
            }
        }
        
        // 必填参数
        params.put("product_service_name", request.getProductServiceName());
        
        // 可选参数 - 使用下划线命名格式
        if (request.getCopyType() != null && !request.getCopyType().isEmpty()) {
            params.put("copy_type", request.getCopyType());
        }
        if (request.getCoreSellingPoints() != null && !request.getCoreSellingPoints().isEmpty()) {
            params.put("core_selling_points", request.getCoreSellingPoints());
        }
        if (request.getForbiddenWords() != null && !request.getForbiddenWords().isEmpty()) {
            params.put("forbidden_words", request.getForbiddenWords());
        }
        if (request.getKeywords() != null && !request.getKeywords().isEmpty()) {
            params.put("keywords", request.getKeywords());
        }
        if (request.getReferenceLink() != null && !request.getReferenceLink().isEmpty()) {
            params.put("reference_link", request.getReferenceLink());
        }
        if (request.getStructurePreference() != null && !request.getStructurePreference().isEmpty()) {
            params.put("structure_preference", request.getStructurePreference());
        }
        if (request.getTargetAudience() != null && !request.getTargetAudience().isEmpty()) {
            params.put("target_audience", request.getTargetAudience());
        }
        if (request.getToneStyle() != null && !request.getToneStyle().isEmpty()) {
            params.put("tone_style", request.getToneStyle());
        }
        if (request.getUsageScenario() != null && !request.getUsageScenario().isEmpty()) {
            params.put("usage_scenario", request.getUsageScenario());
        }
        if (request.getWordCountLimit() != null && !request.getWordCountLimit().isEmpty()) {
            params.put("word_count_limit", request.getWordCountLimit());
        }
        
        log.info("========== 传给文案工作流的参数 ==========");
        params.forEach((key, value) -> log.info("{}: {}", key, value));
        log.info("==========================================");
        
        return params;
    }

    /**
     * 异步生成文案（立即返回任务 ID）
     */
    @Override
    public CopywritingResponse generateCopywritingAsync(CopywritingRequest request, String username) {


        log.info("开始异步生成文案，产品名称：{}", request.getProductServiceName());
            
        // 创建任务
        String taskId = taskManager.createTask(username);

        // 立即返回任务 ID
        CopywritingResponse response = new CopywritingResponse();
        response.setTaskId(taskId);
        response.setStatus("PROCESSING");
        response.setErrorMessage("任务已提交，请稍后查询");
    
        // 异步执行生成逻辑
        new Thread(() -> {
            try {
                log.info("后台线程开始处理任务：{}", taskId);
                taskManager.updateTask(taskId, "PROCESSING", 10, "正在生成文案...");
    
                // 执行同步生成逻辑（传入用户名）
                CopywritingResponse result = executeCopywritingGeneration(request);
    
                taskManager.updateTask(taskId, "PROCESSING", 80, "处理中...");
    
                // 根据结果更新任务状态
                if ("SUCCESS".equals(result.getStatus())) {
                    taskManager.completeCopywritingTask(taskId, result.getContent(), result.getOutputLinks());
                    log.info("任务 {} 完成", taskId);
                } else {
                    taskManager.failTask(taskId, result.getErrorMessage());
                    log.error("任务 {} 失败：{}", taskId, result.getErrorMessage());
                }
            } catch (Exception e) {
                log.error("异步任务 {} 执行失败", taskId, e);
                taskManager.failTask(taskId, e.getMessage());
            }
        }).start();
    
        return response;
    }
}
