import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

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
import { AppCoachModule } from './modules/app-coach/app-coach.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentPacksModule } from './modules/content-packs/content-packs.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { EbarimtModule } from './modules/ebarimt/ebarimt.module';
import { EgshModule } from './modules/egsh/egsh.module';
import { FocusModule } from './modules/focus/focus.module';
import { MeModule } from './modules/me/me.module';
import { OlympiadModule } from './modules/olympiad/olympiad.module';
import { ParentModule } from './modules/parent/parent.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PracticeModule } from './modules/practice/practice.module';
import { PsrModule } from './modules/psr/psr.module';
import { RosterModule } from './modules/roster/roster.module';
import { SchoolModule } from './modules/school/school.module';
import { SmsModule } from './modules/sms/sms.module';
import { StudyAbroadModule } from './modules/study-abroad/study-abroad.module';
import { SurgeModule } from './modules/surge/surge.module';
import { TeacherAcademyModule } from './modules/teacher-academy/teacher-academy.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { WellbeingModule } from './modules/wellbeing/wellbeing.module';
import { SessionMiddleware } from './middleware/session.middleware';
import { TenantScopeMiddleware } from './middleware/tenant-scope.middleware';

@Module({
  imports: [
    // ScheduleModule.forRoot() arms @Cron decorators (currently used by
    // ScholarshipWatchDispatcher; deliberately wired once at the app level
    // so future cron jobs don't each have to re-import it).
    ScheduleModule.forRoot(),
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
    TeacherAcademyModule,
    ContentPacksModule,
    ParentModule,
    FocusModule,
    PsrModule,
    StudyAbroadModule,
    SchoolModule,
    AppCoachModule,
    WellbeingModule,
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
