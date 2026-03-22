import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CozeController } from './coze.controller';
import { CozeService } from './coze.service';

@Module({
  imports: [HttpModule],
  controllers: [CozeController],
  providers: [CozeService],
})
export class CozeModule {}
