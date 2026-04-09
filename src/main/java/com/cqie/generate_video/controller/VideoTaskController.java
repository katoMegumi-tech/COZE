package com.cqie.generate_video.controller;


import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/video/task")
@RequiredArgsConstructor
@Tag(name = "视频任务", description = "视频生成任务相关接口")
public class VideoTaskController {
}
