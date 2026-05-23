import { Module, OnModuleInit } from '@nestjs/common';

import { PaymentsModule } from '../payments/payments.module';

import { SurgeController } from './surge.controller';
import { SurgeService } from './surge.service';

@Module({
  imports: [PaymentsModule],
  controllers: [SurgeController],
  providers: [SurgeService],
  exports: [SurgeService],
})
export class SurgeModule implements OnModuleInit {
  constructor(private readonly surge: SurgeService) {}

  onModuleInit(): void {
    // Always start the consumer — it drains any tokens still in the stream
    // even after SURGE_ENABLED is flipped off (so flipping off the gate
    // doesn't strand queued users).
    this.surge.startConsumer();
  }
}
