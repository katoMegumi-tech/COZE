import { Injectable } from '@nestjs/common';
import { Response } from 'express';

// 后端API配置
const BACKEND_API = {
  baseUrl: 'http://192.168.146.161:8080',
  workflowEndpoint: '/coze/workflow/',
};

@Injectable()
export class CozeService {
  async runWorkflow(
    params: {
      images: string[];
      product_desc?: string;
      product_features?: string;
      product_name?: string;
      product_price?: string;
      video_aspect_ratio?: '16:9' | '9:16' | '1:1';
      video_length?: number;
      video_num?: number;
      video_resolution?: '480P' | '720P' | '1080P';
      video_scene?: string;
      video_style?: string;
      video_subtitle?: boolean;
    },
    res: Response,
  ) {
    const url = `${BACKEND_API.baseUrl}${BACKEND_API.workflowEndpoint}`;
    
    console.log('[CozeService] Calling backend:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      // 转发 SSE 流
      const reader = response.body;
      
      if (!reader) {
        throw new Error('No response body');
      }

      // 使用流式读取并转发
      for await (const chunk of reader as AsyncIterable<Buffer>) {
        const data = chunk.toString();
        res.write(data);
      }

      console.log('[CozeService] Stream completed');
    } catch (error) {
      console.error('[CozeService] Error:', error);
      throw error;
    }
  }
}
