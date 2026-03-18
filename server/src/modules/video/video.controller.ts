import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { VideoService } from './video.service';
import { HeaderUtils } from 'coze-coding-dev-sdk';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateVideo(
    @Body()
    body: {
      prompt: string;
      imageUrl?: string;
      duration?: number;
      resolution?: '480p' | '720p' | '1080p';
      ratio?: '16:9' | '9:16' | '1:1';
      generateAudio?: boolean;
    },
    @Req() req: Request,
  ) {
    console.log('[VideoController] Received video generation request:', body);

    if (!body.prompt || body.prompt.trim() === '') {
      return {
        code: 400,
        msg: '请输入提示词',
        data: null,
      };
    }

    try {
      const customHeaders = HeaderUtils.extractForwardHeaders(
        req.headers as Record<string, string>,
      );
      const result = await this.videoService.generateVideo(
        {
          prompt: body.prompt,
          imageUrl: body.imageUrl,
          duration: body.duration,
          resolution: body.resolution,
          ratio: body.ratio,
          generateAudio: body.generateAudio,
        },
        customHeaders,
      );

      return {
        code: 200,
        msg: '视频生成成功',
        data: result,
      };
    } catch (error) {
      console.error('[VideoController] Video generation error:', error);
      return {
        code: 500,
        msg: '视频生成失败，请重试',
        data: null,
      };
    }
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async checkStatus(@Body('taskId') taskId: string) {
    console.log('[VideoController] Received status check request:', { taskId });

    if (!taskId) {
      return {
        code: 400,
        msg: '请提供任务ID',
        data: null,
      };
    }

    try {
      const result = await this.videoService.checkVideoStatus(taskId);
      return {
        code: 200,
        msg: '查询成功',
        data: result,
      };
    } catch (error) {
      console.error('[VideoController] Status check error:', error);
      return {
        code: 500,
        msg: '查询失败，请重试',
        data: null,
      };
    }
  }
}
