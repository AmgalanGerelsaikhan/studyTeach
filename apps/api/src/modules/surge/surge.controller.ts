import { Controller, Get, Param } from '@nestjs/common';
import type { QueuePositionResponse } from '@studyteach/contracts';

import { SurgeService } from './surge.service';

@Controller()
export class SurgeController {
  constructor(private readonly surge: SurgeService) {}

  @Get('queue-position/:token')
  async position(@Param('token') token: string): Promise<QueuePositionResponse> {
    return this.surge.position(token);
  }
}
