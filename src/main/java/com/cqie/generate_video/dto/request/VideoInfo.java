package com.cqie.generate_video.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 视频信息
 */
@Data
@Schema(description = "视频信息")
public class VideoInfo {

    @Schema(description = "视频ID", example = "7624453729957494790")
    private String id;

    @Schema(description = "文件大小（字节）", example = "13345304")
    private Long bytes;

    @Schema(description = "文件名")
    private String fileName;

    @Schema(description = "创建时间")
    private String createdAt;
}
