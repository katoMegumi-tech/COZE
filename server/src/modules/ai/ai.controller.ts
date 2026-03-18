import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AiService } from './ai.service';
import { HeaderUtils } from 'coze-coding-dev-sdk';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('optimize-prompt')
  @HttpCode(HttpStatus.OK)
  async optimizePrompt(
    @Body('prompt') prompt: string,
    @Req() req: Request,
  ) {
    console.log('[AiController] Received optimize prompt request:', { prompt });

    if (!prompt || prompt.trim() === '') {
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
      const optimizedPrompt = await this.aiService.optimizePrompt(
        prompt,
        customHeaders,
      );
      return {
        code: 200,
        msg: '优化成功',
        data: { prompt: optimizedPrompt },
      };
    } catch (error) {
      console.error('[AiController] Optimization error:', error);
      return {
        code: 500,
        msg: '优化失败，请重试',
        data: null,
      };
    }
  }

  @Post('polish-prompt')
  @HttpCode(HttpStatus.OK)
  async polishPrompt(
    @Body('prompt') prompt: string,
    @Req() req: Request,
  ) {
    console.log('[AiController] Received polish prompt request:', { prompt });

    if (!prompt || prompt.trim() === '') {
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
      const polishedPrompt = await this.aiService.polishPrompt(
        prompt,
        customHeaders,
      );
      return {
        code: 200,
        msg: '润色成功',
        data: { prompt: polishedPrompt },
      };
    } catch (error) {
      console.error('[AiController] Polishing error:', error);
      return {
        code: 500,
        msg: '润色失败，请重试',
        data: null,
      };
    }
  }
}
