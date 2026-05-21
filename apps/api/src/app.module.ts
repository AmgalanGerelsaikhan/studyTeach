import { Module } from '@nestjs/common';

import { ConfigModule } from './lib/config/config.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, HealthModule],
})
export class AppModule {}
