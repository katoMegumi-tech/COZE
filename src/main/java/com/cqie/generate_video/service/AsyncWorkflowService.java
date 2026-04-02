package com.cqie.generate_video.service;

import com.cqie.generate_video.dto.request.CozeWorkflowRequest;
import com.cqie.generate_video.dto.response.CozeWorkflowResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * 异步工作流服务
 */
@Service
public class AsyncWorkflowService {
    
    private static final Logger log = LoggerFactory.getLogger(AsyncWorkflowService.class);
    
    private final CozeWorkflowService cozeWorkflowService;
    private final TaskManager taskManager;
    
    public AsyncWorkflowService(CozeWorkflowService cozeWorkflowService, TaskManager taskManager) {
        this.cozeWorkflowService = cozeWorkflowService;
        this.taskManager = taskManager;
    }
    
    /**
     * 异步执行工作流
     */
    @Async("videoTaskExecutor")
    public void executeWorkflowAsync(String taskId, CozeWorkflowRequest request) {
        log.info("异步任务开始执行，taskId: {}, 线程: {}", taskId, Thread.currentThread().getName());

        
        try {
            // 更新状态为处理中
            taskManager.updateTask(taskId, "PROCESSING", 10, "正在生成视频...");
            
            // 执行工作流
            CozeWorkflowResponse response = cozeWorkflowService.runWorkflow(request);
            
            // 更新进度
            taskManager.updateTask(taskId, "PROCESSING", 80, "视频生成中...");
            
            // 处理结果
            if (response.getData() != null && response.getData().getVideoUrls() != null 
                && !response.getData().getVideoUrls().isEmpty()) {
                
                if (response.getData().getErrorMessage() != null) {
                    taskManager.failTask(taskId, response.getData().getErrorMessage());
                } else {
                    taskManager.completeTask(taskId, response.getData().getVideoUrls());
                    log.info("任务 {} 完成，生成 {} 个视频", taskId, response.getData().getVideoUrls().size());
                }
            } else {
                String errorMsg = response.getData() != null && response.getData().getErrorMessage() != null 
                    ? response.getData().getErrorMessage() 
                    : "生成失败";
                taskManager.failTask(taskId, errorMsg);
            }
            
        } catch (Exception e) {
            log.error("任务 {} 执行失败", taskId, e);
            taskManager.failTask(taskId, e.getMessage());
        }
    }
}
