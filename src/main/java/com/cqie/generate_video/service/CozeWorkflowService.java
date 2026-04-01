package com.cqie.generate_video.service;

import com.cqie.generate_video.dto.request.CozeWorkflowRequest;
import com.cqie.generate_video.dto.response.CozeWorkflowResponse;

/**
 * Coze 工作流服务接口
 */
public interface CozeWorkflowService {

    /**
     * 运行 Coze 工作流生成视频
     * 
     * @param request 工作流请求参数
     * @return 工作流响应结果
     */
    CozeWorkflowResponse runWorkflow(CozeWorkflowRequest request, String username);
}
