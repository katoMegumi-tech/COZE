import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
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
    @Res() res: Response,
  ) {
    console.log('[CozeController] Received workflow request');

    if (!body.images || body.images.length === 0) {
      return res.status(HttpStatus.OK).json({
        code: 400,
        message: '请上传至少一张图片',
        data: null,
      });
    }

    try {
      const result = await this.cozeService.runWorkflow(body);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      console.error('[CozeController] Workflow error:', error);
      return res.status(HttpStatus.OK).json({
        code: 500,
        message: error.message || '工作流调用失败',
        data: null,
      });
    }
  }
}
