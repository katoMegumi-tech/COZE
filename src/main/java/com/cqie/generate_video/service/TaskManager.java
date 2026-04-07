package com.cqie.generate_video.service;

import com.cqie.generate_video.dto.response.TaskStatusResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 任务管理器（Redis版）
 */
@Component
public class TaskManager {
    
    private static final Logger log = LoggerFactory.getLogger(TaskManager.class);
    
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    
    // Redis key 前缀
    private static final String TASK_KEY_PREFIX = "video:task:";
    
    // 任务过期时间（24小时）
    private static final long TASK_EXPIRE_HOURS = 24;
    
    public TaskManager(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * 创建新任务
     */
    public String createTask() {
        String taskId = UUID.randomUUID().toString();
        TaskStatusResponse task = new TaskStatusResponse();
        task.setTaskId(taskId);
        task.setStatus("PENDING");
        task.setProgress(0);
        task.setMessage("任务已创建，等待处理");
        
        saveTask(taskId, task);
        log.info("创建任务: {}", taskId);
        return taskId;
    }
    
    /**
     * 更新任务状态
     */
    public void updateTask(String taskId, String status, Integer progress, String message) {
        TaskStatusResponse task = getTask(taskId);
        if (task != null) {
            task.setStatus(status);
            task.setProgress(progress);
            task.setMessage(message);
            saveTask(taskId, task);
            log.debug("更新任务 {} 状态: {} - {}", taskId, status, message);
        }
    }
    
    /**
     * 设置任务完成
     */
    public void completeTask(String taskId, List<String> videoUrls) {
        completeTask(taskId, videoUrls, null);
    }

    /**
     * 设置任务完成（带 debugUrl）
     */
    public void completeTask(String taskId, List<String> videoUrls, String debugUrl) {
        TaskStatusResponse task = getTask(taskId);
        if (task != null) {
            task.setStatus("COMPLETED");
            task.setProgress(100);
            task.setMessage("视频生成成功");
            task.setVideoUrls(videoUrls);
            if (debugUrl != null && !debugUrl.isEmpty()) {
                task.setDebugUrl(debugUrl);
            }
            saveTask(taskId, task);
            log.info("任务 {} 完成，生成 {} 个视频", taskId, videoUrls.size());
        }
    }
    
    /**
     * 设置任务失败
     */
    public void failTask(String taskId, String errorMessage) {
        failTask(taskId, errorMessage, null);
    }

    /**
     * 设置任务失败（带 debugUrl）
     */
    public void failTask(String taskId, String errorMessage, String debugUrl) {
        TaskStatusResponse task = getTask(taskId);
        if (task != null) {
            task.setStatus("FAILED");
            task.setProgress(0);
            task.setMessage("生成失败");
            task.setErrorMessage(errorMessage);
            if (debugUrl != null && !debugUrl.isEmpty()) {
                task.setDebugUrl(debugUrl);
            }
            saveTask(taskId, task);
            log.error("任务 {} 失败: {}", taskId, errorMessage);
        }
    }
    
    /**
     * 获取任务状态
     */
    public TaskStatusResponse getTask(String taskId) {
        try {
            String key = TASK_KEY_PREFIX + taskId;
            String json = redisTemplate.opsForValue().get(key);
            if (json != null) {
                return objectMapper.readValue(json, TaskStatusResponse.class);
            }
        } catch (Exception e) {
            log.error("获取任务 {} 失败", taskId, e);
        }
        return null;
    }
    
    /**
     * 保存任务到 Redis
     */
    private void saveTask(String taskId, TaskStatusResponse task) {
        try {
            String key = TASK_KEY_PREFIX + taskId;
            String json = objectMapper.writeValueAsString(task);
            redisTemplate.opsForValue().set(key, json, TASK_EXPIRE_HOURS, TimeUnit.HOURS);
            log.info("任务 {} 已保存到 Redis, key: {}", taskId, key);
        } catch (JsonProcessingException e) {
            log.error("保存任务 {} 失败", taskId, e);
        }
    }
    
    /**
     * 设置文案任务完成
     */
    public void completeCopywritingTask(String taskId, String content, List<String> outputLinks) {
        TaskStatusResponse task = getTask(taskId);
        if (task != null) {
            task.setStatus("COMPLETED");
            task.setProgress(100);
            task.setMessage("文案生成成功");
            task.setCopywritingContent(content);
            task.setOutputLinks(outputLinks);
            saveTask(taskId, task);
            log.info("文案任务 {} 完成", taskId);
        }
    }

    /**
     * 删除任务
     */
    public void removeTask(String taskId) {
        String key = TASK_KEY_PREFIX + taskId;
        redisTemplate.delete(key);
        log.debug("删除任务: {}", taskId);
    }
}
