package com.cqie.generate_video.entity;


import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("video_task")
public class VideoTaskDO {

    @TableId(type = IdType.INPUT)
    @Schema(description = "任务id")
    private String taskId;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "任务状态0：失败1：成功2：进行中")
    @TableField(value = "`status`")
    private Integer status;

    @Schema(description = "消息")
    private String message;

    @Schema(description = "视频地址")
    private String videoUrl;

    @Schema(description = "调试地址")
    private String debugUrl;

    @Schema(description = "错误信息")
    private String errorMessage;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "删除标志")
    private Integer deleted;
}
