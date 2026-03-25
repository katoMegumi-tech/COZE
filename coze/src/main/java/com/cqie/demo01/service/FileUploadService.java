package com.cqie.demo01.service;

import com.cqie.demo01.dto.response.CozeFileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传服务接口
 */
public interface FileUploadService {
    
    /**
     * 上传文件到 Coze 平台
     * 
     * @param file 要上传的文件
     * @return 文件信息
     * @throws Exception 上传失败时抛出异常
     */
    CozeFileUploadResponse.FileData uploadToCoze(MultipartFile file) throws Exception;
}
