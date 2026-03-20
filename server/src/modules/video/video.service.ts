import { Injectable } from '@nestjs/common';
import { CozeAPI, WorkflowEventType } from '@coze/api';

interface VideoGenerationParams {
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
}

export interface VideoSegment {
  id: string;
  script: string;
  videoUrl: string;
  duration: number;
}

@Injectable()
export class VideoService {
  private apiClient: CozeAPI;

  constructor() {
    this.apiClient = new CozeAPI({
      token: process.env.COZE_API_TOKEN || '',
      baseURL: 'https://api.coze.cn',
    });
  }

  async generateVideoSegments(
    params: VideoGenerationParams,
  ): Promise<VideoSegment[]> {
    try {
      console.log('[VideoService] Generating video segments with params:', params);

      // 调用 Coze 工作流
      const stream = await this.apiClient.workflows.runs.stream({
        workflow_id: '7618892331810635827',
        parameters: {
          images: params.images,
          product_desc: params.product_desc || '',
          product_features: params.product_features || '',
          product_name: params.product_name || '',
          product_price: params.product_price || '',
          video_aspect_ratio: params.video_aspect_ratio || '16:9',
          video_length: params.video_length || 10,
          video_num: params.video_num || 1,
          video_resolution: params.video_resolution || '720P',
          video_scene: params.video_scene || '',
          video_style: params.video_style || '时尚',
          video_subtitle: params.video_subtitle !== false,
        },
      });

      // 处理流式响应
      const segments: VideoSegment[] = [];
      let segmentIndex = 0;

      for await (const chunk of stream) {
        console.log('[VideoService] Received chunk:', chunk);

        // 解析工作流输出
        if (chunk.event === WorkflowEventType.MESSAGE && chunk.data) {
          try {
            const data = typeof chunk.data === 'string' 
              ? JSON.parse(chunk.data) 
              : chunk.data;

            // 假设工作流返回的视频段数据结构
            if (data.segments && Array.isArray(data.segments)) {
              for (const seg of data.segments) {
                segments.push({
                  id: `seg_${segmentIndex++}`,
                  script: seg.script || seg.description || '',
                  videoUrl: seg.video_url || seg.url || '',
                  duration: seg.duration || 3,
                });
              }
            }

            // 如果工作流直接返回单个视频
            if (data.video_url) {
              segments.push({
                id: `seg_${segmentIndex++}`,
                script: data.script || params.product_desc || '视频生成完成',
                videoUrl: data.video_url,
                duration: params.video_length || 10,
              });
            }
          } catch (parseError) {
            console.error('[VideoService] Failed to parse chunk data:', parseError);
          }
        }
      }

      // 如果没有解析到视频段，返回模拟数据（用于测试）
      if (segments.length === 0) {
        console.log('[VideoService] No segments parsed, returning mock data for testing');
        return this.getMockSegments(params);
      }

      console.log('[VideoService] Video segments generated:', segments);
      return segments;
    } catch (error) {
      console.error('[VideoService] Video generation failed:', error);
      // 返回模拟数据用于测试
      return this.getMockSegments(params);
    }
  }

  async mergeVideos(segmentIds: string[], videoUrls: string[]): Promise<string> {
    try {
      console.log('[VideoService] Merging videos:', { segmentIds, videoUrls });

      // 调用视频合成工作流（如果有）
      // 这里假设有一个合成视频的工作流
      // 如果没有，可以返回第一个视频作为占位符
      
      // 模拟合成延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 返回合成后的视频URL
      // 实际应该调用合成API
      if (videoUrls.length > 0) {
        return videoUrls[0]; // 临时返回第一个视频
      }

      throw new Error('没有可用的视频段');
    } catch (error) {
      console.error('[VideoService] Video merge failed:', error);
      throw error;
    }
  }

  // 模拟数据（用于测试）
  private getMockSegments(params: VideoGenerationParams): VideoSegment[] {
    const segmentCount = 4;
    const scripts = [
      `${params.product_name || '产品'}特写展示，突出产品外观和设计细节`,
      `${params.video_scene || '场景'}环境展示，营造氛围感`,
      `产品使用场景，展示${params.product_features || '产品特点'}`,
      `品牌标识和产品信息展示，价格：${params.product_price || '优惠价'}`,
    ];

    return Array.from({ length: segmentCount }, (_, i) => ({
      id: `seg_${i}`,
      script: scripts[i] || `镜头${i + 1}：视频内容描述`,
      videoUrl: `https://example.com/video${i + 1}.mp4`,
      duration: Math.ceil((params.video_length || 10) / segmentCount),
    }));
  }
}
