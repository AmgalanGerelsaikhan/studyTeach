import { Controller, Get, Inject } from '@nestjs/common';
import type { Health } from '@studyteach/contracts';

import { ENV } from '../lib/config/config.module';
import type { Env } from '../lib/config/env';

@Controller()
export class HealthController {
  private readonly startedAt = Date.now();
  constructor(@Inject(ENV) private readonly env: Env) {}

  @Get('health')
  health(): Health {
    return {
      status: 'ok',
      service: '@studyteach/api',
      version: process.env['npm_package_version'] ?? '0.0.0',
      uptime_seconds: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }

  @Get('readiness')
  readiness(): { status: 'ok'; env_loaded: true; node_env: string } {
    // Proof that env was loaded by the ConfigModule (constraint #11).
    return { status: 'ok', env_loaded: true, node_env: this.env.NODE_ENV };
  }
}
