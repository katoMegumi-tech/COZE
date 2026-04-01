package com.cqie.generate_video.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 创建任务响应（只返回任务 ID）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "创建视频生成任务响应")
public class CreateTaskResponse {
    
    @Schema(description = "任务 ID", example = "868216677925142600")
    private String task_id;
}
