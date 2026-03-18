import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log('[UploadController] Received file upload request:', {
      fieldname: file?.fieldname,
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
    });

    if (!file) {
      return {
        code: 400,
        msg: '请选择要上传的图片',
        data: null,
      };
    }

    try {
      const result = await this.uploadService.uploadImage(file);
      return {
        code: 200,
        msg: '上传成功',
        data: result,
      };
    } catch (error) {
      console.error('[UploadController] Upload error:', error);
      return {
        code: 500,
        msg: '上传失败，请重试',
        data: null,
      };
    }
  }

  @Post('image-url')
  @HttpCode(HttpStatus.OK)
  async uploadFromUrl(@Body('url') url: string) {
    console.log('[UploadController] Received URL upload request:', { url });

    if (!url) {
      return {
        code: 400,
        msg: '请提供图片URL',
        data: null,
      };
    }

    try {
      const result = await this.uploadService.uploadFromUrl(url);
      return {
        code: 200,
        msg: '上传成功',
        data: result,
      };
    } catch (error) {
      console.error('[UploadController] Upload from URL error:', error);
      return {
        code: 500,
        msg: '上传失败，请重试',
        data: null,
      };
    }
  }
}
