import { Injectable } from '@nestjs/common';

export interface Template {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  usageCount: number;
  category: string;
  tags: string[];
}

@Injectable()
export class TemplateService {
  private templates: Template[] = [
    {
      id: '1',
      title: '产品展示模版',
      description: '适合展示产品细节和特点的通用模版',
      thumbnail: 'https://picsum.photos/200/300?random=1',
      usageCount: 8327,
      category: 'product',
      tags: ['产品', '展示', '电商'],
    },
    {
      id: '2',
      title: '店铺宣传模版',
      description: '适合店铺宣传和品牌推广的模版',
      thumbnail: 'https://picsum.photos/200/300?random=2',
      usageCount: 3232,
      category: 'shop',
      tags: ['店铺', '宣传', '品牌'],
    },
    {
      id: '3',
      title: '节日促销模版',
      description: '适合节日促销活动的营销模版',
      thumbnail: 'https://picsum.photos/200/300?random=3',
      usageCount: 5641,
      category: 'promotion',
      tags: ['节日', '促销', '营销'],
    },
    {
      id: '4',
      title: '新品发布模版',
      description: '适合新产品发布的宣传模版',
      thumbnail: 'https://picsum.photos/200/300?random=4',
      usageCount: 2156,
      category: 'product',
      tags: ['新品', '发布', '产品'],
    },
    {
      id: '5',
      title: '美食展示模版',
      description: '适合餐饮行业美食展示的模版',
      thumbnail: 'https://picsum.photos/200/300?random=5',
      usageCount: 6789,
      category: 'food',
      tags: ['美食', '餐饮', '展示'],
    },
    {
      id: '6',
      title: '服装穿搭模版',
      description: '适合服装行业的穿搭展示模版',
      thumbnail: 'https://picsum.photos/200/300?random=6',
      usageCount: 4523,
      category: 'fashion',
      tags: ['服装', '穿搭', '时尚'],
    },
  ];

  async getTemplates(
    category?: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{
    list: Template[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    console.log('[TemplateService] Getting templates:', {
      category,
      page,
      pageSize,
    });

    let filteredTemplates = this.templates;

    if (category) {
      filteredTemplates = this.templates.filter(
        (t) => t.category === category,
      );
    }

    const total = filteredTemplates.length;
    const startIndex = (page - 1) * pageSize;
    const list = filteredTemplates.slice(startIndex, startIndex + pageSize);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async getTemplateById(id: string): Promise<Template | null> {
    console.log('[TemplateService] Getting template by id:', { id });

    return this.templates.find((t) => t.id === id) || null;
  }

  async getCategories(): Promise<string[]> {
    const categories = [...new Set(this.templates.map((t) => t.category))];
    return categories;
  }
}
