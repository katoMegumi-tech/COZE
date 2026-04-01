package com.cqie.generate_video.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Coze 文件上传响应
 */
@Schema(description = "Coze 文件上传响应")
@Data
public class CozeFileUploadResponse {
    
    @Schema(description = "状态码，0 表示成功", example = "0")
    /**
     * 状态码，0 表示成功
     */
    private Integer code;
    
    @Schema(description = "状态信息", example = "success")
    /**
     * 状态信息
     */
    private String msg;
    
    @Schema(description = "文件数据")
    /**
     * 文件数据
     */
    private FileData data;
    
    @Schema(description = "文件数据详情")
    @Data
    public static class FileData {
        @Schema(description = "文件 ID", example = "7619656250259341366")
        /**
         * 文件 ID
         */
        private String id;
        
        @Schema(description = "文件大小（字节）", example = "1024")
        /**
         * 文件大小（字节）
         */
        private Long bytes;
        
        @Schema(description = "文件名称", example = "product.jpg")
        /**
         * 文件名称
         */
        private String fileName;
        
        @Schema(description = "上传时间（Unix 时间戳，秒）", example = "1712000000")
        /**
         * 上传时间（Unix 时间戳，秒）
         */
        private Long createdAt;
    }
}
