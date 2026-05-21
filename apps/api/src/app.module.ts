import { Module } from '@nestjs/common';

import { AuditModule } from './lib/audit/audit.module';
import { ConfigModule } from './lib/config/config.module';
import { DbModule } from './lib/db/db.module';
import { OtpModule } from './lib/otp/otp.module';
import { RedisModule } from './lib/redis/redis.module';
import { SessionsModule } from './lib/sessions/sessions.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    RedisModule,
    AuditModule,
    SessionsModule,
    OtpModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
