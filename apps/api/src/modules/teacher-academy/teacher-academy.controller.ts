import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  AssessmentSubmitRequest,
  EnrollmentRequest,
  LessonCompleteRequest,
  type AcademyFacets,
  type Assessment,
  type AssessmentSubmitResponse,
  type Certification,
  type CourseDetail,
  type CourseListResponse,
  type CpdTranscript,
  type EnrollmentDescriptor,
  type LessonCompleteResponse,
  type PlaybackToken,
} from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { AssessmentService } from './assessment.service';
import { CertificationService } from './certification.service';
import { CloudflareStreamService } from './cloudflare-stream.service';
import { CourseService } from './course.service';
import { EnrollmentService } from './enrollment.service';

// Catalog query — array filters arrive repeated (?subject=a&subject=b); numbers
// are coerced from the query string.
const CourseListQueryHttp = z.object({
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  methodology: z.string().optional(),
  language_track: z
    .enum(['GENERAL', 'ENGLISH_A1', 'ENGLISH_A2', 'ENGLISH_B1', 'ENGLISH_B2'])
    .optional(),
  cursor: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

@Controller()
@UseGuards(RolesGuard)
export class TeacherAcademyController {
  constructor(
    private readonly db: Db,
    private readonly courses: CourseService,
    private readonly enrollments: EnrollmentService,
    private readonly assessments: AssessmentService,
    private readonly certifications: CertificationService,
    private readonly stream: CloudflareStreamService,
  ) {}

  @Get('teacher-academy/courses')
  @Roles('TEACHER', 'SCHOOL_ADMIN')
  async list(
    @CurrentContext() ctx: RequestContext | undefined,
    @Query() raw: unknown,
  ): Promise<CourseListResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = CourseListQueryHttp.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const subjectFilter = Array.isArray(parsed.data.subject)
      ? parsed.data.subject
      : parsed.data.subject
        ? [parsed.data.subject]
        : undefined;
    const input: Parameters<CourseService['list']>[0] = {
      limit: parsed.data.limit,
      ...(subjectFilter ? { subject: subjectFilter } : {}),
      ...(parsed.data.grade !== undefined ? { grade: parsed.data.grade } : {}),
      ...(parsed.data.methodology ? { methodology: parsed.data.methodology } : {}),
      ...(parsed.data.language_track ? { language_track: parsed.data.language_track } : {}),
      ...(parsed.data.cursor !== undefined ? { cursor: parsed.data.cursor } : {}),
    };
    return this.courses.list(input, ctx.user_id);
  }

  @Get('teacher-academy/facets')
  @Roles('TEACHER', 'SCHOOL_ADMIN')
  async facets(@CurrentContext() ctx: RequestContext | undefined): Promise<AcademyFacets> {
    if (!ctx) throw new UnauthorizedException();
    return this.courses.facets();
  }

  @Get('teacher-academy/courses/:courseId')
  @Roles('TEACHER', 'SCHOOL_ADMIN')
  async detail(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('courseId') courseId: string,
  ): Promise<CourseDetail> {
    if (!ctx) throw new UnauthorizedException();
    return this.courses.detail(parsePositiveInt(courseId, 'course_id'), ctx.user_id);
  }

  @Get('teacher-academy/assessments/:assessmentId')
  @Roles('TEACHER')
  async getAssessment(@Param('assessmentId') assessmentId: string): Promise<Assessment> {
    return this.assessments.get(parsePositiveInt(assessmentId, 'assessment_id'));
  }

  @Post('teacher-academy/enrollments')
  @Roles('TEACHER')
  async enroll(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<EnrollmentDescriptor> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = EnrollmentRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const desc = await this.enrollments.enroll({
      courseId: parsed.data.course_id,
      teacherUserId: ctx.user_id,
      organizationCode: ctx.organization_code,
    });
    // Row-level idempotency is on (course_id, teacher_user_id); the offline
    // queue's idempotency_key is touched only for traceability.
    void parsed.data.idempotency_key;
    return desc;
  }

  @Post('teacher-academy/lessons/:lessonId/complete')
  @Roles('TEACHER')
  async completeLesson(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('lessonId') lessonId: string,
    @Body() raw: unknown,
  ): Promise<LessonCompleteResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = LessonCompleteRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const result = await this.enrollments.completeLesson({
      lessonId: parsePositiveInt(lessonId, 'lesson_id'),
      teacherUserId: ctx.user_id,
      watchSeconds: parsed.data.watch_seconds,
    });
    void parsed.data.idempotency_key;
    return result;
  }

  @Get('teacher-academy/lessons/:lessonId/playback')
  @Roles('TEACHER')
  async playback(@Param('lessonId') lessonId: string): Promise<PlaybackToken> {
    return this.stream.mintPlaybackToken(parsePositiveInt(lessonId, 'lesson_id'));
  }

  @Post('teacher-academy/assessments/:assessmentId/submit')
  @Roles('TEACHER')
  async submitAssessment(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('assessmentId') assessmentId: string,
    @Body() raw: unknown,
  ): Promise<AssessmentSubmitResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = AssessmentSubmitRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const id = parsePositiveInt(assessmentId, 'assessment_id');
    const enrollmentId = await this.resolveEnrollmentForAssessment(id, ctx.user_id);
    const result = await this.assessments.submit({
      assessmentId: id,
      enrollmentId,
      answers: parsed.data.answers,
    });
    void parsed.data.idempotency_key;
    return result;
  }

  // ── E-026 — Certifications + CPD transcript ───────────────────────────────

  @Get('teacher-academy/certifications')
  @Roles('TEACHER')
  async listOwnCertifications(
    @CurrentContext() ctx: RequestContext | undefined,
  ): Promise<{ items: Certification[] }> {
    if (!ctx) throw new UnauthorizedException();
    const items = await this.certifications.listOwn(ctx.user_id);
    return { items };
  }

  @Get('teacher-academy/transcript')
  @Roles('TEACHER')
  async ownTranscript(@CurrentContext() ctx: RequestContext | undefined): Promise<CpdTranscript> {
    if (!ctx) throw new UnauthorizedException();
    return this.certifications.ownTranscript(ctx.user_id);
  }

  @Get('teacher-academy/teachers/:teacherUserId/transcript')
  @Roles('SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async teacherTranscript(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('teacherUserId') teacherUserId: string,
  ): Promise<CpdTranscript> {
    if (!ctx) throw new UnauthorizedException();
    const targetId = parsePositiveInt(teacherUserId, 'teacher_user_id');
    if (ctx.primary_role !== 'SCHOOL_ADMIN' && ctx.primary_role !== 'PLATFORM_ADMIN') {
      // Defensive — RolesGuard already enforces, but keeps the union narrow.
      throw new UnauthorizedException();
    }
    return this.certifications.transcriptForRequester({
      targetTeacherUserId: targetId,
      requesterUserId: ctx.user_id,
      requesterRole: ctx.primary_role,
      requesterOrganizationCode: ctx.organization_code,
    });
  }

  /** Resolves the caller's enrollment in the course that owns an assessment. */
  private async resolveEnrollmentForAssessment(
    assessmentId: number,
    teacherUserId: number,
  ): Promise<number> {
    const { rows } = await this.db.query<{ enrollment_id: number }>(
      `SELECT e.enrollment_id
         FROM academy_assessments a
         JOIN academy_enrollments e
           ON e.course_id = a.course_id AND e.teacher_user_id = $2
        WHERE a.assessment_id = $1`,
      [assessmentId, teacherUserId],
    );
    const row = rows[0];
    if (!row) {
      throw new ConflictException('enroll in the course before submitting its assessment');
    }
    return row.enrollment_id;
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}
