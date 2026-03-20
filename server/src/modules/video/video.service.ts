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
      let videoUrl: string | null = null;
      let scriptContent = params.product_desc || 'AI生成视频';

      for await (const chunk of stream) {
        console.log('[VideoService] Received chunk:', JSON.stringify(chunk, null, 2));

        // 解析工作流输出 - 检查 MESSAGE 事件
        if (chunk.event === WorkflowEventType.MESSAGE && chunk.data) {
          try {
            // chunk.data 结构: { content: '{"video":"https://..."}', content_type: 'text', node_is_finish: true, ... }
            const data = typeof chunk.data === 'string' 
              ? JSON.parse(chunk.data) 
              : chunk.data;

            console.log('[VideoService] Parsed data:', data);

            // 检查是否是结束节点且包含 content
            if (data.node_is_finish && data.content) {
              // 解析 content 字段中的 JSON
              const contentData = typeof data.content === 'string'
                ? JSON.parse(data.content)
                : data.content;

              console.log('[VideoService] Content data:', contentData);

              // 提取视频 URL
              if (contentData.video) {
                videoUrl = contentData.video;
                console.log('[VideoService] Video URL found:', videoUrl);
              }
            }
          } catch (parseError) {
            console.error('[VideoService] Failed to parse chunk data:', parseError);
          }
        }

        // 检查 DONE 事件
        if (chunk.event === WorkflowEventType.DONE) {
          console.log('[VideoService] Workflow completed');
        }
      }

      // 如果成功获取到视频 URL，返回视频分段
      if (videoUrl) {
        const segments: VideoSegment[] = [{
          id: 'seg_0',
          script: scriptContent,
          videoUrl: videoUrl,
          duration: params.video_length || 10,
        }];
        console.log('[VideoService] Video segments generated:', segments);
        return segments;
      }

      // 如果没有解析到视频，返回模拟数据
      console.log('[VideoService] No video URL parsed, returning mock data for testing');
      return this.getMockSegments(params);
    } catch (error) {
      console.error('[VideoService] Video generation failed:', error);
      // 返回模拟数据用于测试
      return this.getMockSegments(params);
    }
  }

  async mergeVideos(segmentIds: string[], videoUrls: string[]): Promise<string> {
    try {
      console.log('[VideoService] Merging videos:', { segmentIds, videoUrls });
      
      // 如果只有一个视频，直接返回
      if (videoUrls.length === 1) {
        return videoUrls[0];
      }

      // TODO: 实现真实的视频合并逻辑
      // 这里可以调用 FFmpeg 或其他视频处理服务
      // 目前返回第一个视频作为占位
      return videoUrls[0];
    } catch (error) {
      console.error('[VideoService] Video merge failed:', error);
      throw error;
    }
  }

  async regenerateSegment(
    segmentId: string,
    params: VideoGenerationParams,
  ): Promise<VideoSegment> {
    try {
      console.log('[VideoService] Regenerating segment:', segmentId);

      // 重新调用视频生成
      const segments = await this.generateVideoSegments(params);
      
      if (segments.length > 0) {
        return {
          ...segments[0],
          id: segmentId,
        };
      }

      // 返回模拟数据
      return {
        id: segmentId,
        script: params.product_desc || '重新生成的视频',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: params.video_length || 10,
      };
    } catch (error) {
      console.error('[VideoService] Segment regeneration failed:', error);
      throw error;
    }
  }

  /**
   * 获取模拟视频分段数据（用于测试和降级）
   */
  private getMockSegments(params: VideoGenerationParams): VideoSegment[] {
    console.log('[VideoService] Returning mock segments for params:', params);
    
    const segmentCount = Math.min(params.video_num || 1, 4);
    const segments: VideoSegment[] = [];

    const scriptTemplates = [
      `${params.product_name || '产品'}特写展示，突出产品外观和设计细节`,
      `${params.video_scene || '场景'}环境展示，营造氛围感`,
      `产品使用场景，展示${params.product_features || '产品特点'}`,
      `品牌标识和产品信息展示，价格：${params.product_price || '优惠价'}`,
    ];

    for (let i = 0; i < segmentCount; i++) {
      segments.push({
        id: `seg_${i}`,
        script: scriptTemplates[i % scriptTemplates.length],
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        duration: Math.floor((params.video_length || 10) / segmentCount),
      });
    }

    return segments;
  }
}
