import { Module } from '@nestjs/common';

import { PublicController } from './public.controller';
import { PublicService } from './public.service';

/**
 * Anonymous landing-page module. Single endpoint: GET /public/stats.
 * Cached server-side for 5 minutes. No tenant scope (everything here is
 * org-agnostic counts + closed-enum reference rows).
 */
@Module({
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
