package com.cqie.generate_video.controller;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.cqie.generate_video.dto.response.GetVideoTaskResponse;
import com.cqie.generate_video.entity.VideoTaskDO;
import com.cqie.generate_video.result.Result;
import com.cqie.generate_video.service.VideoTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/video/task")
@RequiredArgsConstructor
@Tag(name = "视频任务", description = "视频生成任务相关接口")
public class VideoTaskController {

    private final VideoTaskService videoTaskService;

    @GetMapping("/list")
    @Operation(summary = "获取视频生成任务列表", description = "分页获取视频生成任务列表")
    public Result<IPage<VideoTaskDO>> getVideoTaskList(@RequestParam long current, @RequestParam long size) {
        return Result.success(videoTaskService.getVideoTaskList(current, size));
    }
}
