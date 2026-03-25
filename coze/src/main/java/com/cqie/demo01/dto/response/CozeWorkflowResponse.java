package com.cqie.demo01.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CozeWorkflowResponse {

    private Integer code;

    private String message;

    private WorkflowData data;

    @lombok.Data
    public static class WorkflowData {
        private String id;
        private String status;
        private String debugData; // 调试用的原始数据
        private String errorMessage;
        private Long createTime;
        
        /**
         * 从 content 中提取的视频 URL 列表
         */
        private List<String> videoUrls;

        /**
         * 第一个视频 URL（便捷访问）
         */
        private String firstVideoUrl;
        
        /**
         * content 中的完整 JSON 数据
         */
        private JsonNode contentJson;

        /**
         * 从流式输出数据中提取视频 URL 列表
         * 扣子工作流返回格式：
         * {"content":"{\"video\":[\"url1\",\"url2\"]}", ...}
         */
        public void parseFromStreamData(String streamData) {
            if (streamData == null || streamData.isEmpty()) {
                this.errorMessage = "流式数据为空";
                return;
            }

            System.out.println("开始解析流式数据，长度：" + streamData.length());
            this.videoUrls = new ArrayList<>();
            ObjectMapper mapper = new ObjectMapper();
            
            try {
                // 按空行分割多个响应块
                String[] blocks = streamData.split("\\}\\{");
                System.out.println("检测到 " + blocks.length + " 个数据块");
                
                for (int i = 0; i < blocks.length; i++) {
                    String block = blocks[i];
                    // 修复 JSON 格式（补充可能缺失的大括号）
                    if (i == 0 && !block.trim().endsWith("}")) {
                        block = block + "}";
                    } else if (i == blocks.length - 1 && !block.trim().startsWith("{")) {
                        block = "{" + block;
                    } else if (i > 0 && i < blocks.length - 1) {
                        block = "{" + block + "}";
                    }
                    
                    System.out.println("处理数据块 #" + i + ": " + block.substring(0, Math.min(100, block.length())));
                    
                    try {
                        JsonNode jsonNode = mapper.readTree(block);
                        
                        // 提取 content 字段
                        JsonNode contentNode = jsonNode.get("content");
                        if (contentNode != null && contentNode.isTextual()) {
                            String contentStr = contentNode.asText();
                            System.out.println("提取到 content: " + contentStr);
                            
                            // 解析 content 中的 JSON
                            try {
                                JsonNode contentJson = mapper.readTree(contentStr);
                                this.contentJson = contentJson; // 保存用于调试
                                
                                // 提取 video 数组
                                JsonNode videoNode = contentJson.get("video");
                                if (videoNode != null) {
                                    for (JsonNode urlNode : videoNode) {
                                        String url = urlNode.asText();
                                        if (!url.isEmpty()) {
                                            this.videoUrls.add(url);
                                            System.out.println("提取到视频 URL: " + url);
                                        }
                                    }

                                    // 设置第一个视频 URL
                                    if (!this.videoUrls.isEmpty() && this.firstVideoUrl == null) {
                                        this.firstVideoUrl = this.videoUrls.get(0);
                                    }
                                } else {
                                    System.out.println("未找到 video 字段或不是数组");
                                    // 打印 content 中的所有字段用于调试
                                    System.out.println("content 中的字段：" + contentJson.fieldNames());
                                }
                            } catch (Exception e) {
                                System.err.println("解析 content JSON 失败：" + contentStr);
                                e.printStackTrace();
                            }
                        }
                    } catch (Exception e) {
                        // 忽略单个 JSON 解析错误
                        System.err.println("解析数据块失败：" + block.substring(0, Math.min(50, block.length())));
                    }
                }
                
                // 总结
                if (!this.videoUrls.isEmpty()) {
                    System.out.println("成功提取 " + this.videoUrls.size() + " 个视频 URL，第一个：" + this.firstVideoUrl);
                } else {
                    System.out.println("警告：未从流式数据中提取到任何视频 URL");
                    this.errorMessage = "未找到视频 URL";
                }
                
            } catch (Exception e) {
                e.printStackTrace();
                this.errorMessage = "解析流式数据失败：" + e.getMessage();
            }
        }
    }
}
