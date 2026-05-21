import { Module } from '@nestjs/common';

import { CurriculumModule } from '../curriculum/curriculum.module';

import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { BktService } from './bkt.service';
import { QuotaService } from './quota.service';

@Module({
  imports: [CurriculumModule],
  controllers: [AiTutorController],
  providers: [AiTutorService, BktService, QuotaService],
  exports: [AiTutorService, QuotaService, BktService],
})
export class AiTutorModule {}
