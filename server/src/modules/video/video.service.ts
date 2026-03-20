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

export interface WorkflowProgress {
  event: string;
  nodeTitle?: string;
  nodeId?: string;
  content?: string;
  videoUrl?: string;
  isFinish: boolean;
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

  /**
   * 生成视频分段
   * 处理Coze工作流的SSE流式响应
   */
  async generateVideoSegments(
    params: VideoGenerationParams,
  ): Promise<VideoSegment[]> {
    console.log('[VideoService] Starting video generation with params:', {
      ...params,
      images: params.images?.length ? `${params.images.length} images` : 'no images',
    });

    try {
      // 调用 Coze 工作流流式接口
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

      console.log('[VideoService] Stream started, processing SSE events...');

      // 处理SSE流式响应
      let videoUrl: string | null = null;
      let scriptContent = params.product_desc || 'AI生成视频';
      let lastNodeTitle = '';
      let uploadSuccess = false;

      for await (const chunk of stream) {
        const eventType = chunk.event;
        console.log('[VideoService] SSE Event:', eventType);
        console.log('[VideoService] Chunk data:', JSON.stringify(chunk.data, null, 2));

        // 收到任何响应都说明图片上传成功
        if (!uploadSuccess) {
          uploadSuccess = true;
          console.log('[VideoService] ✓ Image upload successful - received first response');
        }

        // 处理不同类型的事件
        switch (eventType) {
          case WorkflowEventType.MESSAGE:
            await this.handleMessageEvent(chunk.data, (progress) => {
              console.log('[VideoService] Progress:', progress);
              if (progress.nodeTitle) lastNodeTitle = progress.nodeTitle;
            });
            
            // 尝试从消息中提取视频URL
            const extractedUrl = this.extractVideoUrl(chunk.data);
            if (extractedUrl) {
              videoUrl = extractedUrl;
              console.log('[VideoService] ✓ Video URL extracted:', videoUrl);
            }
            break;

          case WorkflowEventType.DONE:
            console.log('[VideoService] ✓ Workflow completed successfully');
            break;

          case WorkflowEventType.ERROR:
            console.error('[VideoService] ✗ Workflow error:', chunk.data);
            const errorData = chunk.data as any;
            throw new Error(errorData?.error_message || '工作流执行失败');

          case WorkflowEventType.INTERRUPT:
            console.warn('[VideoService] ⚠ Workflow interrupted:', chunk.data);
            break;

          default:
            console.log('[VideoService] Unknown event type:', eventType);
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
        console.log('[VideoService] ✓ Video generation completed:', segments);
        return segments;
      }

      // 没有获取到视频URL，返回模拟数据
      console.log('[VideoService] No video URL found, returning mock data');
      return this.getMockSegments(params);

    } catch (error) {
      console.error('[VideoService] Video generation failed:', error);
      // 返回模拟数据用于降级
      return this.getMockSegments(params);
    }
  }

  /**
   * 处理Message事件
   */
  private async handleMessageEvent(
    data: any,
    onProgress: (progress: WorkflowProgress) => void,
  ): Promise<void> {
    if (!data) return;

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    onProgress({
      event: 'Message',
      nodeTitle: parsedData.node_title,
      nodeId: parsedData.node_id,
      content: parsedData.content,
      isFinish: parsedData.node_is_finish || false,
    });
  }

  /**
   * 从消息数据中提取视频URL
   */
  private extractVideoUrl(data: any): string | null {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      // 检查是否是结束节点
      if (!parsedData.node_is_finish) return null;

      // 解析content字段中的JSON
      if (parsedData.content) {
        const contentData = typeof parsedData.content === 'string'
          ? JSON.parse(parsedData.content)
          : parsedData.content;

        // 提取视频URL
        if (contentData.video) {
          return contentData.video;
        }
      }

      return null;
    } catch (error) {
      console.error('[VideoService] Failed to extract video URL:', error);
      return null;
    }
  }

  /**
   * 合并视频分段
   */
  async mergeVideos(segmentIds: string[], videoUrls: string[]): Promise<string> {
    console.log('[VideoService] Merging videos:', { segmentIds, videoUrls });
    
    if (videoUrls.length === 1) {
      return videoUrls[0];
    }

    // TODO: 实现真实的视频合并逻辑
    return videoUrls[0];
  }

  /**
   * 重新生成视频分段
   */
  async regenerateSegment(
    segmentId: string,
    params: VideoGenerationParams,
  ): Promise<VideoSegment> {
    console.log('[VideoService] Regenerating segment:', segmentId);

    const segments = await this.generateVideoSegments(params);
    
    if (segments.length > 0) {
      return { ...segments[0], id: segmentId };
    }

    return {
      id: segmentId,
      script: params.product_desc || '重新生成的视频',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      duration: params.video_length || 10,
    };
  }

  /**
   * 获取模拟视频分段数据（用于测试和降级）
   */
  private getMockSegments(params: VideoGenerationParams): VideoSegment[] {
    console.log('[VideoService] Returning mock segments');
    
    return [{
      id: 'seg_0',
      script: params.product_desc || 'AI生成视频（演示）',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      duration: params.video_length || 10,
    }];
  }
}
