import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TemplateModule } from './modules/template/template.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [TemplateModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
