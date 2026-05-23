import { Module } from '@nestjs/common';

import { MasteryService } from './mastery.service';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController],
  providers: [MasteryService],
  exports: [MasteryService],
})
export class MeModule {}
