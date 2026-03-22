import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// 用户后端API配置
const USER_BACKEND = {
  baseUrl: 'http://192.168.146.161:8080',
  workflowEndpoint: '/coze/workflow/',
};

@Injectable()
export class CozeService {
  constructor(private readonly httpService: HttpService) {}

  async runWorkflow(params: {
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
  }): Promise<any> {
    const url = `${USER_BACKEND.baseUrl}${USER_BACKEND.workflowEndpoint}`;
    
    console.log('[CozeService] Calling user backend:', url);
    console.log('[CozeService] Params:', {
      ...params,
      images: params.images?.length ? `${params.images.length} images` : 'no images',
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
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
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 300000, // 5分钟超时
        }),
      );

      console.log('[CozeService] Response status:', response.status);
      console.log('[CozeService] Response data:', JSON.stringify(response.data).substring(0, 500));

      return response.data;
    } catch (error: any) {
      console.error('[CozeService] Error:', error.message);
      
      if (error.response) {
        // 服务器返回了错误响应
        return {
          code: error.response.status || 500,
          message: error.response.data?.message || error.message,
          data: null,
        };
      }
      
      // 网络错误或其他错误
      throw error;
    }
  }
}
