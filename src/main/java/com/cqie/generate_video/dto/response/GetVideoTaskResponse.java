package com.cqie.generate_video.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GetVideoTaskResponse {

    /**
     * 视频状态 0失败，1成功，2处理中
     */
    private Integer status;

    private String videoUrl;

    private String errorMessage;

    private LocalDateTime createdTime;
}
