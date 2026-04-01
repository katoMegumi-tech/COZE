package com.cqie.generate_video.controller;

import com.cqie.generate_video.dto.request.CopywritingRequest;
import com.cqie.generate_video.dto.response.CopywritingResponse;
import com.cqie.generate_video.dto.response.TaskStatusResponse;
import com.cqie.generate_video.result.Result;
import com.cqie.generate_video.service.CopywritingService;
import com.cqie.generate_video.service.TaskManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * 文案生成控制器
 */
@Tag(name = "文案生成", description = "AI文案生成相关接口")
@RestController
@RequestMapping("/api/copywriting")
@CrossOrigin()
public class CopywritingController {
    
    private static final Logger log = LoggerFactory.getLogger(CopywritingController.class);
    
    private final CopywritingService copywritingService;
    private final TaskManager taskManager;

    public CopywritingController(CopywritingService copywritingService, TaskManager taskManager) {
        this.copywritingService = copywritingService;
        this.taskManager = taskManager;
    }
    
    /**
     * 生成文案（同步方式，等待结果）
     */
    @Operation(summary = "生成文案", description = "根据产品信息和参数生成营销文案（同步方式）")
    @PreAuthorize("hasAuthority('copywriting:generate')")
    @PostMapping("/generate")
    public Result<CopywritingResponse> generateCopywriting(@Valid @RequestBody CopywritingRequest request) {
        
        log.info("========== 收到文案生成请求 ==========");
        log.info("产品名称: {}", request.getProductServiceName());
        log.info("文件ID列表: {}", request.getFileIds());
        log.info("核心卖点: {}", request.getCoreSellingPoints());
        log.info("目标受众: {}", request.getTargetAudience());
        log.info("使用场景: {}", request.getUsageScenario());
        log.info("文案类型: {}", request.getCopyType());
        log.info("语气风格: {}", request.getToneStyle());
        log.info("字数限制: {}", request.getWordCountLimit());
        log.info("结构偏好: {}", request.getStructurePreference());
        log.info("关键词: {}", request.getKeywords());
        log.info("禁用词: {}", request.getForbiddenWords());
        log.info("参考链接: {}", request.getReferenceLink());
        log.info("==========================================");
        
        CopywritingResponse response = copywritingService.generateCopywriting(request);
        
        if ("SUCCESS".equals(response.getStatus())) {
            return Result.success(response);
        } else {
            return Result.error(response.getErrorMessage());
        }
    }

    /**
     * 异步生成文案（立即返回任务ID）
     */
    @Operation(summary = "异步生成文案", description = "根据产品信息生成营销文案，异步方式（立即返回任务ID）")
    @PreAuthorize("hasAuthority('copywriting:generate-async')")
    @PostMapping("/generate-async")
    public Result<CopywritingResponse> generateCopywritingAsync(@Valid @RequestBody CopywritingRequest request) {

        log.info("========== 收到异步文案生成请求 ==========");
        log.info("产品名称: {}", request.getProductServiceName());
        log.info("==========================================");

        CopywritingResponse response = copywritingService.generateCopywritingAsync(request);
        return Result.success(response);
    }

    /**
     * 查询文案生成任务状态
     */
    @Operation(summary = "查询任务状态", description = "查询异步生成文案任务的状态")
    @PreAuthorize("hasAuthority('copywriting:taskStatus')")
    @GetMapping("/task-status/{taskId}")
    public Result<TaskStatusResponse> getTaskStatus(@PathVariable String taskId) {
        log.info("查询任务状态: {}", taskId);

        TaskStatusResponse task = taskManager.getTask(taskId);
        if (task == null) {
            return Result.error("任务不存在或已过期");
        }
        return Result.success(task);
    }
}
