import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AcademyLanguageTrack, Certification, CpdTranscript } from '@studyteach/contracts';

import { AuditService } from '../../lib/audit/audit.service';
import { Db } from '../../lib/db/pool';

/**
 * Teacher Academy CPD certifications + transcript (E-026, PRD §4.5).
 *
 * Issuance lives in AssessmentService — the badge is a side effect of a
 * passing FINAL. This service handles READS:
 *
 *   - own transcript (TEACHER): lists every badge for the caller plus totals.
 *   - school-admin transcript: org-scoped read of a teacher's transcript;
 *     writes an audit_log entry per CLAUDE.md hard constraint #4 (every
 *     cross-tenant-equivalent read leaves a trail). The org check is here so
 *     a misuse of the route still gets logged via the rbac.denied path.
 *
 * Visibility rules:
 *   - SCHOOL_ADMIN may read a teacher in their own organization_code.
 *     Any other org → ForbiddenException + no audit row (the *attempt* is
 *     captured by the RolesGuard's existing rbac.denied flow, not here).
 *   - PLATFORM_ADMIN may read any teacher; the cross-org read is still
 *     audit-logged.
 */
@Injectable()
export class CertificationService {
  constructor(
    private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  /** Caller's own transcript. */
  async ownTranscript(teacherUserId: number): Promise<CpdTranscript> {
    return this.buildTranscript(teacherUserId);
  }

  /**
   * School-admin / platform-admin read of a teacher's transcript. Validates
   * the requester is allowed to see this teacher's data, then audits the read.
   */
  async transcriptForRequester(input: {
    targetTeacherUserId: number;
    requesterUserId: number;
    requesterRole: 'SCHOOL_ADMIN' | 'PLATFORM_ADMIN';
    requesterOrganizationCode: string | null;
  }): Promise<CpdTranscript> {
    const { rows } = await this.db.query<{
      user_id: number;
      primary_role: string;
      organization_code: string | null;
    }>(
      `SELECT user_id, primary_role::text AS primary_role, organization_code
         FROM users WHERE user_id = $1`,
      [input.targetTeacherUserId],
    );
    const target = rows[0];
    if (!target) throw new NotFoundException('teacher not found');
    if (target.primary_role !== 'TEACHER') {
      throw new NotFoundException('user is not a teacher');
    }

    if (input.requesterRole === 'SCHOOL_ADMIN') {
      if (
        input.requesterOrganizationCode === null ||
        target.organization_code !== input.requesterOrganizationCode
      ) {
        // Match the RolesGuard pattern: a forbidden cross-org read leaves
        // its trail via rbac.denied. We deliberately do NOT also audit here
        // so a single attempt produces one log row.
        throw new ForbiddenException('teacher is not in your school');
      }
    }

    await this.audit.record({
      actor_user_id: input.requesterUserId,
      action: 'cpd_transcript.read',
      target_type: 'user',
      target_id: String(input.targetTeacherUserId),
      metadata: {
        requester_role: input.requesterRole,
        target_organization_code: target.organization_code,
      },
    });

    return this.buildTranscript(input.targetTeacherUserId);
  }

  /** Caller's own list of badges (lightweight; same data as transcript.certifications). */
  async listOwn(teacherUserId: number): Promise<Certification[]> {
    return this.loadCertifications(teacherUserId);
  }

  private async buildTranscript(teacherUserId: number): Promise<CpdTranscript> {
    const certifications = await this.loadCertifications(teacherUserId);
    const totals = certifications.reduce(
      (acc, c) => {
        acc.total_cpd_credits += c.cpd_credits;
        acc.total_courses_completed += 1;
        if (c.moe_endorsed) acc.moe_endorsed_credits += c.cpd_credits;
        return acc;
      },
      { total_cpd_credits: 0, total_courses_completed: 0, moe_endorsed_credits: 0 },
    );
    return {
      teacher_user_id: teacherUserId,
      total_cpd_credits: Number(totals.total_cpd_credits.toFixed(1)),
      total_courses_completed: totals.total_courses_completed,
      moe_endorsed_credits: Number(totals.moe_endorsed_credits.toFixed(1)),
      certifications,
    };
  }

  private async loadCertifications(teacherUserId: number): Promise<Certification[]> {
    const { rows } = await this.db.query<{
      certification_id: number;
      course_id: number;
      course_title: string;
      subject: string;
      language_track: AcademyLanguageTrack;
      score: number;
      cpd_credits: string;
      moe_endorsed: boolean;
      issued_at: Date;
    }>(
      `SELECT c.certification_id,
              c.course_id,
              co.title          AS course_title,
              co.subject,
              co.language_track,
              c.score,
              c.cpd_credits,
              c.moe_endorsed,
              c.issued_at
         FROM academy_certifications c
         JOIN academy_courses co ON co.course_id = c.course_id
        WHERE c.teacher_user_id = $1
        ORDER BY c.issued_at DESC, c.certification_id DESC`,
      [teacherUserId],
    );
    return rows.map((r) => ({
      certification_id: r.certification_id,
      course_id: r.course_id,
      course_title: r.course_title,
      subject: r.subject,
      language_track: r.language_track,
      score: r.score,
      cpd_credits: Number(r.cpd_credits),
      moe_endorsed: r.moe_endorsed,
      issued_at: r.issued_at.toISOString(),
    }));
  }
}
