import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TemplateModule } from './modules/template/template.module';
import { AiModule } from './modules/ai/ai.module';
import { CozeModule } from './modules/coze/coze.module';

@Module({
  imports: [TemplateModule, AiModule, CozeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
