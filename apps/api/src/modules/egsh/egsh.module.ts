import { Module } from '@nestjs/common';

import { AiTutorModule } from '../ai-tutor/ai-tutor.module';

import { CohortService } from './cohort.service';
import { EgshController } from './egsh.controller';
import { MockService } from './mock.service';
import { PaperService } from './paper.service';
import { PredictorService } from './predictor.service';

@Module({
  imports: [AiTutorModule],
  controllers: [EgshController],
  providers: [PaperService, MockService, PredictorService, CohortService],
  exports: [PaperService, MockService, PredictorService, CohortService],
})
export class EgshModule {}
