package com.cqie.generate_video.controller;

import com.cqie.generate_video.dto.request.CozeWorkflowRequest;
import com.cqie.generate_video.dto.response.TaskStatusResponse;
import com.cqie.generate_video.result.Result;
import com.cqie.generate_video.service.AsyncWorkflowService;
import com.cqie.generate_video.service.TaskManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.Map;

/**
 * Coze 工作流控制器
 */
@RestController
@RequestMapping("/api/coze")
@CrossOrigin()
@Tag(name = "视频生成", description = "Coze 视频生成工作流异步调用及状态查询接口")
public class CozeWorkflowController {
    
    private static final Logger log = LoggerFactory.getLogger(CozeWorkflowController.class);
    
    private final AsyncWorkflowService asyncWorkflowService;
    private final TaskManager taskManager;

    public CozeWorkflowController(AsyncWorkflowService asyncWorkflowService, TaskManager taskManager) {
        this.asyncWorkflowService = asyncWorkflowService;
        this.taskManager = taskManager;
    }

    /**
     * 异步运行 Coze 工作流生成视频
     * 
     * @param request 工作流请求参数
     * @return 任务ID
     */
    @PreAuthorize("hasAuthority('coze:workflow:async')")
    @PostMapping("/workflow/async")
    @Operation(summary = "异步运行 Coze 工作流", description = "提交视频生成任务并返回任务ID")
    public Result<Map<String, String>> runWorkflowAsync(@Valid @RequestBody CozeWorkflowRequest request) {
        
        log.info("========== 收到前端请求（异步） ==========");
        log.info("fileId: {}", request.getFileId());
        log.info("productName: {}", request.getProductName());
        log.info("productDesc: {}", request.getProductDesc());
        log.info("productFeatures: {}", request.getProductFeatures());
        log.info("productPrice: {}", request.getProductPrice());
        log.info("videoAspectRatio: {}", request.getVideoAspectRatio());
        log.info("videoLength: {}", request.getVideoLength());
        log.info("videoNum: {}", request.getVideoNum());
        log.info("videoResolution: {}", request.getVideoResolution());
        log.info("videoScene: {}", request.getVideoScene());
        log.info("videoStyle: {}", request.getVideoStyle());
        log.info("videoSubtitle: {}", request.getVideoSubtitle());
        log.info("==========================================");
        
        // 创建任务
        String taskId = taskManager.createTask();
        
        // 异步执行（通过 Service 调用）
        asyncWorkflowService.executeWorkflowAsync(taskId, request);
        
        Map<String, String> result = new HashMap<>();
        result.put("taskId", taskId);
        result.put("message", "任务已提交，请使用任务ID查询进度");
        
        return Result.success(result);
    }
    
    /**
     * 查询任务状态
     * 
     * @param taskId 任务ID
     * @return 任务状态
     */
    @PreAuthorize("hasAuthority('coze:workflow:status')")
    @GetMapping("/workflow/status/{taskId}")
    @Operation(summary = "查询任务状态", description = "根据任务ID获取视频生成任务的当前状态及结果")
    public Result<TaskStatusResponse> getTaskStatus(@PathVariable String taskId) {
        TaskStatusResponse task = taskManager.getTask(taskId);
        if (task == null) {
            return Result.error("任务不存在");
        }
        return Result.success(task);
    }
}
