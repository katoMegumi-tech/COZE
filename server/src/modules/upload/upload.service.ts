import { Injectable } from '@nestjs/common';
import { S3Storage } from 'coze-coding-dev-sdk';

@Injectable()
export class UploadService {
  private storage: S3Storage;

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    try {
      // 上传文件到对象存储
      const key = await this.storage.uploadFile({
        fileContent: file.buffer,
        fileName: `images/${Date.now()}_${file.originalname}`,
        contentType: file.mimetype,
      });

      // 生成可访问的签名 URL
      const url = await this.storage.generatePresignedUrl({
        key,
        expireTime: 86400 * 7, // 7天有效期
      });

      console.log('[UploadService] Image uploaded successfully:', { key, url });

      return { url, key };
    } catch (error) {
      console.error('[UploadService] Upload failed:', error);
      throw error;
    }
  }

  async uploadFromUrl(imageUrl: string): Promise<{ url: string; key: string }> {
    try {
      // 从 URL 下载并上传到对象存储
      const key = await this.storage.uploadFromUrl({
        url: imageUrl,
        timeout: 30000,
      });

      // 生成可访问的签名 URL
      const url = await this.storage.generatePresignedUrl({
        key,
        expireTime: 86400 * 7,
      });

      console.log('[UploadService] Image uploaded from URL successfully:', { key, url });

      return { url, key };
    } catch (error) {
      console.error('[UploadService] Upload from URL failed:', error);
      throw error;
    }
  }
}
