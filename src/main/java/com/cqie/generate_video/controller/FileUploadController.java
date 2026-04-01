package com.cqie.generate_video.controller;

import com.cqie.generate_video.dto.response.CozeFileUploadResponse;
import com.cqie.generate_video.result.Result;
import com.cqie.generate_video.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/api/upload")
@CrossOrigin()
@Tag(name = "文件上传", description = "上传视频/图片文件到各平台")
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
    @PreAuthorize("hasAuthority('upload:coze')")
    @PostMapping(value = "/coze", consumes = "multipart/form-data")
    @Operation(summary = "上传文件到 Coze", description = "上传视频文件到 Coze 平台以获取文件ID，用于后续工作流")
    public Result<CozeFileUploadResponse.FileData> uploadToCoze(
            @Parameter(description = "要上传的文件", content = @Content(mediaType = "multipart/form-data"))
            @RequestParam("file") MultipartFile file) {
        
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
