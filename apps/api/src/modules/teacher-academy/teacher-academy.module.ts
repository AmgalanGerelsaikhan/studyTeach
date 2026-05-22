import { Module } from '@nestjs/common';

import { AssessmentService } from './assessment.service';
import { CloudflareStreamService } from './cloudflare-stream.service';
import { CourseService } from './course.service';
import { EnrollmentService } from './enrollment.service';
import { TeacherAcademyController } from './teacher-academy.controller';

/**
 * Teacher Academy — E-025 (PRD §4.5). Global national CPD micro-course
 * catalog, video player tokens, lesson quizzes, idempotent enrollment +
 * completion. Final-assessment grading + CPD badges are E-026.
 */
@Module({
  controllers: [TeacherAcademyController],
  providers: [CourseService, EnrollmentService, AssessmentService, CloudflareStreamService],
  exports: [CourseService, EnrollmentService, AssessmentService, CloudflareStreamService],
})
export class TeacherAcademyModule {}
