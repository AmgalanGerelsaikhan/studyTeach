import { Module } from '@nestjs/common';

import { AuditModule } from '../../lib/audit/audit.module';

import { AssessmentService } from './assessment.service';
import { CertificationService } from './certification.service';
import { CloudflareStreamService } from './cloudflare-stream.service';
import { CourseService } from './course.service';
import { EnrollmentService } from './enrollment.service';
import { TeacherAcademyController } from './teacher-academy.controller';

/**
 * Teacher Academy — E-025/E-026 (PRD §4.5). Global national CPD micro-course
 * catalog, video player tokens, lesson quizzes, idempotent enrollment +
 * completion, final-assessment grading, and CPD badges + transcript.
 */
@Module({
  imports: [AuditModule],
  controllers: [TeacherAcademyController],
  providers: [
    CourseService,
    EnrollmentService,
    AssessmentService,
    CertificationService,
    CloudflareStreamService,
  ],
  exports: [
    CourseService,
    EnrollmentService,
    AssessmentService,
    CertificationService,
    CloudflareStreamService,
  ],
})
export class TeacherAcademyModule {}
