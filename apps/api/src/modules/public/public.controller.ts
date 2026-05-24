import { Controller, Get, Header } from '@nestjs/common';
import type { PublicStats } from '@studyteach/contracts';

import { PublicService } from './public.service';

/**
 * Anonymous landing-page surface. No guard — the only thing here is the
 * stats payload (already PII-scrubbed by PublicService). Sets a
 * Cache-Control header so Cloudflare / browser caches respect the 5-min
 * TTL we apply server-side.
 */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('stats')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
  stats(): Promise<PublicStats> {
    return this.publicService.getStats();
  }
}
