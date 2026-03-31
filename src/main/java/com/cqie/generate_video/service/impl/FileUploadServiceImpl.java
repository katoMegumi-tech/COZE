package com.cqie.generate_video.service.impl;

import com.cqie.generate_video.config.CozeConfig;
import com.cqie.generate_video.dto.response.CozeFileUploadResponse;
import com.cqie.generate_video.service.FileUploadService;
import com.google.gson.Gson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传服务实现
 */
@Service
public class FileUploadServiceImpl implements FileUploadService {
    
    private static final Logger log = LoggerFactory.getLogger(FileUploadServiceImpl.class);
    
    private final CozeConfig cozeConfig;
    private final RestTemplate restTemplate;
    private final Gson gson;
    
    public FileUploadServiceImpl(CozeConfig cozeConfig) {
        this.cozeConfig = cozeConfig;
        this.restTemplate = new RestTemplate();
        this.gson = new Gson();
    }
    
    @Override
    public CozeFileUploadResponse.FileData uploadToCoze(MultipartFile file) throws Exception {
        String url = cozeConfig.getBaseUrl() + "/v1/files/upload";
        
        log.info("开始上传文件到 Coze: {}, 大小: {} bytes", file.getOriginalFilename(), file.getSize());
        
        // 构建请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(cozeConfig.getToken());
        
        // 构建 multipart 请求体
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        
        // 将 MultipartFile 转换为 ByteArrayResource
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        
        body.add("file", fileResource);
        
        // 创建请求实体
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        
        try {
            // 发送请求
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            log.info("Coze 响应状态码: {}", response.getStatusCode());
            log.info("Coze 响应内容: {}", response.getBody());
            
            // 解析响应
            CozeFileUploadResponse uploadResponse = gson.fromJson(response.getBody(), CozeFileUploadResponse.class);
            
            if (uploadResponse.getCode() != 0) {
                throw new RuntimeException("上传失败: " + uploadResponse.getMsg());
            }
            
            log.info("文件上传成功，文件 ID: {}", uploadResponse.getData().getId());
            
            return uploadResponse.getData();
            
        } catch (Exception e) {
            log.error("上传文件到 Coze 失败", e);
            throw new Exception("上传失败: " + e.getMessage(), e);
        }
    }
}
