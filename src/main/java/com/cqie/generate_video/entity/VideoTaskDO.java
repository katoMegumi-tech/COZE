package com.cqie.generate_video.entity;


import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("video_task")
public class VideoTaskDO {

    @TableId(type = IdType.INPUT)
    private String taskId;

    private String username;

    @TableField(value = "`status`")
    private Integer status;

    private String message;

    private String videoUrl;

    private String debugUrl;

    private String errorMessage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private Integer deleted;
}
