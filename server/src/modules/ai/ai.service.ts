import { Injectable } from '@nestjs/common';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

@Injectable()
export class AiService {
  private llmClient: LLMClient;

  constructor() {
    const config = new Config();
    this.llmClient = new LLMClient(config);
  }

  async optimizePrompt(prompt: string, headers?: Record<string, string>): Promise<string> {
    try {
      console.log('[AiService] Optimizing prompt:', { prompt });

      // 创建带上下文的客户端
      const client = headers
        ? new LLMClient(new Config(), headers)
        : this.llmClient;

      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的视频创意文案优化助手。你的任务是：
1. 优化用户的提示词，使其更加具体、生动、有吸引力
2. 保持原意不变，但增强描述的画面感和感染力
3. 添加适当的拍摄角度、镜头运动、光影效果等专业术语
4. 控制在100字以内

请直接输出优化后的提示词，不要有任何解释或说明。`,
        },
        {
          role: 'user' as const,
          content: `请优化以下视频创意提示词：\n\n${prompt}`,
        },
      ];

      const response = await client.invoke(messages, {
        model: 'doubao-seed-1-8-251228',
        temperature: 0.7,
      });

      const optimizedPrompt = response.content.trim();
      console.log('[AiService] Prompt optimized successfully:', { optimizedPrompt });

      return optimizedPrompt;
    } catch (error) {
      console.error('[AiService] Optimization failed:', error);
      throw error;
    }
  }

  async polishPrompt(prompt: string, headers?: Record<string, string>): Promise<string> {
    try {
      console.log('[AiService] Polishing prompt:', { prompt });

      const client = headers
        ? new LLMClient(new Config(), headers)
        : this.llmClient;

      const messages = [
        {
          role: 'system' as const,
          content: `你是一个文案润色专家。你的任务是：
1. 对用户的提示词进行润色，使其表达更加流畅
2. 修正语法错误和表达不当的地方
3. 保持原意，提升文字质量
4. 控制在原字数范围内

请直接输出润色后的提示词，不要有任何解释或说明。`,
        },
        {
          role: 'user' as const,
          content: `请润色以下文案：\n\n${prompt}`,
        },
      ];

      const response = await client.invoke(messages, {
        model: 'doubao-seed-1-6-flash-250615',
        temperature: 0.5,
      });

      const polishedPrompt = response.content.trim();
      console.log('[AiService] Prompt polished successfully:', { polishedPrompt });

      return polishedPrompt;
    } catch (error) {
      console.error('[AiService] Polishing failed:', error);
      throw error;
    }
  }
}
