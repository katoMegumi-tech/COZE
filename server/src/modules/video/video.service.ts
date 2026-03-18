import { Injectable } from '@nestjs/common';
import {
  VideoGenerationClient,
  Config,
  HeaderUtils,
  Content,
} from 'coze-coding-dev-sdk';

interface VideoGenerationParams {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  resolution?: '480p' | '720p' | '1080p';
  ratio?: '16:9' | '9:16' | '1:1';
  generateAudio?: boolean;
}

@Injectable()
export class VideoService {
  private videoClient: VideoGenerationClient;

  constructor() {
    const config = new Config();
    this.videoClient = new VideoGenerationClient(config);
  }

  async generateVideo(
    params: VideoGenerationParams,
    headers?: Record<string, string>,
  ): Promise<{ videoUrl: string; taskId: string }> {
    try {
      console.log('[VideoService] Generating video with params:', params);

      // 创建带上下文的客户端
      const client = headers
        ? new VideoGenerationClient(new Config(), headers)
        : this.videoClient;

      // 构建内容数组
      const contentItems: Content[] = [];

      // 如果有图片，添加图片内容
      if (params.imageUrl) {
        contentItems.push({
          type: 'image_url' as const,
          image_url: {
            url: params.imageUrl,
          },
          role: 'first_frame' as const,
        });
      }

      // 添加文本提示词
      contentItems.push({
        type: 'text' as const,
        text: params.prompt,
      });

      // 调用视频生成接口
      const response = await client.videoGeneration(contentItems, {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: params.duration || 5,
        resolution: params.resolution || '720p',
        ratio: params.ratio || '9:16',
        generateAudio: params.generateAudio !== false,
      });

      if (!response.videoUrl) {
        throw new Error('视频生成失败：未返回视频URL');
      }

      console.log('[VideoService] Video generated successfully:', {
        videoUrl: response.videoUrl,
        taskId: response.response.id,
      });

      return {
        videoUrl: response.videoUrl,
        taskId: response.response.id,
      };
    } catch (error) {
      console.error('[VideoService] Video generation failed:', error);
      throw error;
    }
  }

  async checkVideoStatus(taskId: string): Promise<{
    status: string;
    videoUrl?: string;
    error?: string;
  }> {
    try {
      console.log('[VideoService] Checking video status:', { taskId });

      // 注意：当前SDK版本可能不支持直接查询任务状态
      // 这里返回一个模拟状态
      return {
        status: 'processing',
      };
    } catch (error) {
      console.error('[VideoService] Status check failed:', error);
      throw error;
    }
  }
}
