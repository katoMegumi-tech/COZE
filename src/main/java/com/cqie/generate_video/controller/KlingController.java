package com.cqie.generate_video.controller;

import com.cqie.generate_video.dto.request.KlingTaskRequest;
import com.cqie.generate_video.dto.response.CreateTaskResponse;
import com.cqie.generate_video.dto.response.QueryTaskStatusResponse;
import com.cqie.generate_video.dto.response.KlingTaskResponse;
import com.cqie.generate_video.result.Result;
import com.cqie.generate_video.service.KlingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Kling AI 视频生成控制器
 */
@RestController
@RequestMapping("/api/kling")
@CrossOrigin()
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Kling AI 视频生成", description = "使用可灵 AI 接口生成视频")
public class KlingController {

    private final KlingService klingService;

    @PostMapping("/video/create")
    @Operation(summary = "创建视频生成任务", description = "提交视频生成提示词，返回任务 ID")
    public Result<CreateTaskResponse> createVideoTask(@RequestBody KlingTaskRequest request) {
        log.info("Creating Kling video task for prompt: {}", request.getPrompt());
        KlingTaskResponse response = klingService.createVideoTask(request);
        if (response.getCode() == 0) {
            CreateTaskResponse createResponse = new CreateTaskResponse(response.getData().getTask_id());
            return Result.success(createResponse);
        } else {
            log.error("Failed to create Kling video task: {}", response.getMessage());
            return Result.error(response.getMessage());
        }
    }

    @GetMapping("/video/query/{taskId}")
    @Operation(summary = "查询视频生成任务状态", description = "根据任务 ID 查询视频生成进度和结果")
    public Result<QueryTaskStatusResponse> queryTaskStatus(@PathVariable String taskId) {
        log.info("Querying Kling video task status for task_id: {}", taskId);
        KlingTaskResponse response = klingService.queryTaskStatus(taskId);
        if (response.getCode() == 0) {
            QueryTaskStatusResponse queryResponse = new QueryTaskStatusResponse();
            queryResponse.setTask_status(response.getData().getTask_status());
            
            // 如果任务成功且有视频结果，提取视频 URL
            if ("succeed".equals(response.getData().getTask_status()) && 
                response.getData().getTask_result() != null && 
                response.getData().getTask_result().getVideos() != null &&
                !response.getData().getTask_result().getVideos().isEmpty()) {
                
                KlingTaskResponse.Video video = response.getData().getTask_result().getVideos().get(0);
                queryResponse.setVideo_url(video.getUrl());
                queryResponse.setWatermark_video_url(video.getWatermark_url());
                queryResponse.setDuration(video.getDuration());
            }
            
            return Result.success(queryResponse);
        } else {
            log.error("Failed to query Kling video task status: {}", response.getMessage());
            return Result.error(response.getMessage());
        }
    }
}
