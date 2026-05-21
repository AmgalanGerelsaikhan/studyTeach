import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AuditModule } from './lib/audit/audit.module';
import { ConfigModule } from './lib/config/config.module';
import { DbModule } from './lib/db/db.module';
import { LlmModule } from './lib/llm/llm.module';
import { OtpModule } from './lib/otp/otp.module';
import { RedisModule } from './lib/redis/redis.module';
import { SessionsModule } from './lib/sessions/sessions.module';
import { HealthModule } from './health/health.module';
import { AiTutorModule } from './modules/ai-tutor/ai-tutor.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { EbarimtModule } from './modules/ebarimt/ebarimt.module';
import { EgshModule } from './modules/egsh/egsh.module';
import { MeModule } from './modules/me/me.module';
import { OlympiadModule } from './modules/olympiad/olympiad.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PracticeModule } from './modules/practice/practice.module';
import { RosterModule } from './modules/roster/roster.module';
import { SmsModule } from './modules/sms/sms.module';
import { SurgeModule } from './modules/surge/surge.module';
import { TicketModule } from './modules/ticket/ticket.module';
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
    AiTutorModule,
    PracticeModule,
    EgshModule,
    OlympiadModule,
    TicketModule,
    EbarimtModule,
    SmsModule,
    PaymentsModule,
    RosterModule,
    AnalyticsModule,
    SurgeModule,
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
