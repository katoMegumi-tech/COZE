import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CozeService } from './coze.service';

@Controller('coze')
export class CozeController {
  constructor(private readonly cozeService: CozeService) {}

  @Post('workflow')
  async runWorkflow(
    @Body()
    body: {
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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('[CozeController] Received workflow request');

    if (!body.images || body.images.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        code: 400,
        msg: '请上传至少一张图片',
        data: null,
      });
    }

    try {
      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 调用服务并转发 SSE 流
      await this.cozeService.runWorkflow(body, res);

      // 结束响应
      res.end();
    } catch (error) {
      console.error('[CozeController] Workflow error:', error);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          code: 500,
          msg: '工作流调用失败',
          error: error.message,
        });
      }
    }
  }
}
