import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateVideo(
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
  ) {
    console.log('[VideoController] Received video generation request:', body);

    if (!body.images || body.images.length === 0) {
      return {
        code: 400,
        msg: '请上传至少一张图片',
        data: null,
      };
    }

    try {
      const segments = await this.videoService.generateVideoSegments(body);

      return {
        code: 200,
        msg: '视频生成成功',
        data: {
          segments,
          totalCount: segments.length,
        },
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

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  async mergeVideos(
    @Body()
    body: {
      segmentIds: string[];
      videoUrls: string[];
    },
  ) {
    console.log('[VideoController] Received merge request:', body);

    if (!body.segmentIds || body.segmentIds.length === 0) {
      return {
        code: 400,
        msg: '请提供视频分段ID',
        data: null,
      };
    }

    try {
      const videoUrl = await this.videoService.mergeVideos(
        body.segmentIds,
        body.videoUrls,
      );

      return {
        code: 200,
        msg: '视频合成成功',
        data: {
          videoUrl,
        },
      };
    } catch (error) {
      console.error('[VideoController] Video merge error:', error);
      return {
        code: 500,
        msg: '视频合成失败，请重试',
        data: null,
      };
    }
  }

  @Post('regenerate')
  @HttpCode(HttpStatus.OK)
  async regenerateSegment(
    @Body()
    body: {
      segmentId: string;
      images: string[];
      product_desc?: string;
      product_features?: string;
      product_name?: string;
      product_price?: string;
    },
  ) {
    console.log('[VideoController] Received regenerate request:', body);

    try {
      // 重新生成单个视频段
      const segments = await this.videoService.generateVideoSegments({
        images: body.images,
        product_desc: body.product_desc,
        product_features: body.product_features,
        product_name: body.product_name,
        product_price: body.product_price,
        video_length: 3,
        video_num: 1,
      });

      const newSegment = segments[0];

      return {
        code: 200,
        msg: '重新生成成功',
        data: {
          segment: newSegment,
        },
      };
    } catch (error) {
      console.error('[VideoController] Regenerate error:', error);
      return {
        code: 500,
        msg: '重新生成失败，请重试',
        data: null,
      };
    }
  }
}
