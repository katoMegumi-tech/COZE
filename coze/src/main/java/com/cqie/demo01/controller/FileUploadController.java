package com.cqie.demo01.controller;

import com.cqie.demo01.dto.response.CozeFileUploadResponse;
import com.cqie.demo01.result.Result;
import com.cqie.demo01.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传控制器
 */
@Tag(name = "文件上传", description = "文件上传相关接口")
@RestController
@RequestMapping("/api/upload")
@CrossOrigin()
public class FileUploadController {
    
    private final FileUploadService fileUploadService;
    
    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }
    
    /**
     * 上传文件到 Coze 平台
     * 
     * @param file 要上传的文件
     * @return 上传结果，包含文件 ID 等信息
     */
    @Operation(summary = "上传文件到 Coze", description = "上传图片或视频文件到 Coze 平台，返回文件 ID")
    @PostMapping(value = "/coze", consumes = "multipart/form-data")
    public Result<CozeFileUploadResponse.FileData> uploadToCoze(@RequestParam("file") MultipartFile file) {
        
        // 验证文件
        if (file == null || file.isEmpty()) {
            return Result.error("请选择要上传的文件");
        }
        
        // 检查文件大小（512 MB）
        long maxSize = 512L * 1024 * 1024;
        if (file.getSize() > maxSize) {
            return Result.error("文件大小超过限制（最大 512 MB）");
        }
        
        try {
            CozeFileUploadResponse.FileData fileData = fileUploadService.uploadToCoze(file);
            return Result.success(fileData);
        } catch (Exception e) {
            return Result.error("上传失败：" + e.getMessage());
        }
    }
}
