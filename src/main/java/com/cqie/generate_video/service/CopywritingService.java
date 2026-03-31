package com.cqie.generate_video.service;

import com.cqie.generate_video.dto.request.CopywritingRequest;
import com.cqie.generate_video.dto.response.CopywritingResponse;

/**
 * 文案生成服务接口
 */
public interface CopywritingService {
    
    /**
     * 生成文案
     */
    CopywritingResponse generateCopywriting(CopywritingRequest request);

    /**
     * 异步生成文案
     */
    CopywritingResponse generateCopywritingAsync(CopywritingRequest request);
}
