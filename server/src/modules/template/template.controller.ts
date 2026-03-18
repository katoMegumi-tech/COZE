import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TemplateService } from './template.service';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getTemplates(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    console.log('[TemplateController] Received template list request:', {
      category,
      page,
      pageSize,
    });

    try {
      const result = await this.templateService.getTemplates(
        category,
        page ? parseInt(page, 10) : 1,
        pageSize ? parseInt(pageSize, 10) : 10,
      );

      return {
        code: 200,
        msg: '获取成功',
        data: result,
      };
    } catch (error) {
      console.error('[TemplateController] Get templates error:', error);
      return {
        code: 500,
        msg: '获取失败，请重试',
        data: null,
      };
    }
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    console.log('[TemplateController] Received categories request');

    try {
      const categories = await this.templateService.getCategories();
      return {
        code: 200,
        msg: '获取成功',
        data: { categories },
      };
    } catch (error) {
      console.error('[TemplateController] Get categories error:', error);
      return {
        code: 500,
        msg: '获取失败，请重试',
        data: null,
      };
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getTemplateById(@Param('id') id: string) {
    console.log('[TemplateController] Received template detail request:', {
      id,
    });

    try {
      const template = await this.templateService.getTemplateById(id);

      if (!template) {
        return {
          code: 404,
          msg: '模版不存在',
          data: null,
        };
      }

      return {
        code: 200,
        msg: '获取成功',
        data: template,
      };
    } catch (error) {
      console.error('[TemplateController] Get template error:', error);
      return {
        code: 500,
        msg: '获取失败，请重试',
        data: null,
      };
    }
  }
}
