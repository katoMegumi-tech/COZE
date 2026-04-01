package com.cqie.generate_video.service;

import com.cqie.generate_video.dto.request.KlingTaskRequest;
import com.cqie.generate_video.dto.response.KlingTaskResponse;

/**
 * Kling AI 视频生成服务
 */
public interface KlingService {
    /**
     * 创建视频生成任务
     */
    KlingTaskResponse createVideoTask(KlingTaskRequest request);

    /**
     * 查询视频生成任务状态
     * @param taskId 任务 ID
     * @return 任务状态响应
     */
    KlingTaskResponse queryTaskStatus(String taskId);
}
