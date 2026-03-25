package com.cqie.demo01.dto.response;

import lombok.Data;

/**
 * Coze 文件上传响应
 */
@Data
public class CozeFileUploadResponse {
    
    /**
     * 状态码，0 表示成功
     */
    private Integer code;
    
    /**
     * 状态信息
     */
    private String msg;
    
    /**
     * 文件数据
     */
    private FileData data;
    
    @Data
    public static class FileData {
        /**
         * 文件 ID
         */
        private String id;
        
        /**
         * 文件大小（字节）
         */
        private Long bytes;
        
        /**
         * 文件名称
         */
        private String fileName;
        
        /**
         * 上传时间（Unix 时间戳，秒）
         */
        private Long createdAt;
    }
}
