import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuditModule } from './lib/audit/audit.module';
import { ConfigModule } from './lib/config/config.module';
import { DbModule } from './lib/db/db.module';
import { LlmModule } from './lib/llm/llm.module';
import { OtpModule } from './lib/otp/otp.module';
import { RedisModule } from './lib/redis/redis.module';
import { SessionsModule } from './lib/sessions/sessions.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { MeModule } from './modules/me/me.module';
import { SessionMiddleware } from './middleware/session.middleware';
import { TenantScopeMiddleware } from './middleware/tenant-scope.middleware';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    RedisModule,
    AuditModule,
    SessionsModule,
    OtpModule,
    LlmModule,
    HealthModule,
    AuthModule,
    MeModule,
    CurriculumModule,
  ],
  providers: [SessionMiddleware, TenantScopeMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // SessionMiddleware runs on every request; it's a no-op for anonymous calls.
    // TenantScopeMiddleware runs after, only acting when X-Cross-Tenant-Org is set.
    consumer.apply(SessionMiddleware, TenantScopeMiddleware).forRoutes('*');
  }
}
