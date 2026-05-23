import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  PortableStudentRecord,
  PsrAccessGrant,
  PsrAuditEntry,
  PsrGradeEntry,
  PsrIdentity,
  PsrOlympiadEntry,
  PsrTeacherCpdEntry,
} from '@studyteach/contracts';

import { AuditService } from '../../lib/audit/audit.service';
import { Db } from '../../lib/db/pool';

import type { UserRole } from '@studyteach/contracts';

/**
 * Portable Student Record (PRD §4.9).
 *
 * Reads:
 *   - Owner (the student themselves) sees their own record without grant.
 *   - Any other reader needs an active `psr_access_grants` row for their
 *     school OR be a current-school admin/counselor at the student's current
 *     school. PLATFORM_ADMIN can read anything but every read is audited.
 *
 * Every successful read of someone else's record writes an audit_log row.
 * That row is what powers `GET /psr/me/audit` for the owner.
 *
 * Revocation: setting `revoked_at` blocks future grant-based reads. There's
 * no short-lived cache to invalidate in this version — every read re-checks
 * the grants table. A follow-up can cache the grant set per (uuid, school)
 * with a 5-min TTL; the table-read approach is correct, just slower.
 */
@Injectable()
export class PsrService {
  constructor(
    private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────────────

  /** Own record — for STUDENT viewing themselves. No grant check. */
  async getOwn(callerUserId: number): Promise<PortableStudentRecord> {
    const uuid = await this.uuidForUser(callerUserId);
    if (!uuid) throw new NotFoundException('no student record for caller');
    return this.assemble(uuid);
  }

  /**
   * Cross-school read. The caller must either:
   *   (a) hold an active grant for the uuid scoped to their organization
   *   (b) be a SCHOOL_ADMIN at the student's current school
   *   (c) be a PLATFORM_ADMIN
   * Anything else is 403. Every successful read writes an audit_log row
   * including the reason the caller provided.
   */
  async getByUuid(input: {
    callerUserId: number;
    callerRole: UserRole;
    callerOrganizationCode: string | null;
    targetUuid: string;
    reason: string;
  }): Promise<PortableStudentRecord> {
    const allowed = await this.canRead(
      input.targetUuid,
      input.callerRole,
      input.callerOrganizationCode,
    );
    if (!allowed) {
      throw new ForbiddenException('no active grant for this record');
    }
    const record = await this.assemble(input.targetUuid);
    await this.audit.record({
      actor_user_id: input.callerUserId,
      action: 'psr.read',
      target_type: 'psr',
      target_id: input.targetUuid,
      metadata: {
        reason: input.reason,
        reader_role: input.callerRole,
        reader_organization_code: input.callerOrganizationCode,
      },
    });
    return record;
  }

  /** Audit timeline of who read this owner's PSR. */
  async ownAudit(callerUserId: number, limit = 50): Promise<PsrAuditEntry[]> {
    const uuid = await this.uuidForUser(callerUserId);
    if (!uuid) return [];
    const { rows } = await this.db.query<{
      action: string;
      created_at: Date;
      metadata: Record<string, unknown> | null;
    }>(
      `SELECT action, created_at, metadata
         FROM audit_log
        WHERE target_type = 'psr'
          AND target_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [uuid, limit],
    );
    return rows.map((r) => {
      const meta = r.metadata ?? {};
      return {
        action: r.action,
        reader_role: (meta as { reader_role?: string }).reader_role ?? 'UNKNOWN',
        reader_organization_code:
          (meta as { reader_organization_code?: string | null }).reader_organization_code ?? null,
        occurred_at: r.created_at.toISOString(),
        reason: (meta as { reason?: string }).reason ?? null,
      };
    });
  }

  // ── Grants ───────────────────────────────────────────────────────────────

  /**
   * Owner grants a school read access. STUDENT only (parents grant through
   * the Parent Portal — separate path that lives in p4).
   */
  async createGrant(input: {
    callerUserId: number;
    granteeSchoolCode: string;
    reason: string | null;
  }): Promise<PsrAccessGrant> {
    const uuid = await this.uuidForUser(input.callerUserId);
    if (!uuid) throw new NotFoundException('no student record for caller');

    const { rows } = await this.db.query<{
      grant_id: string;
      granted_at: Date;
    }>(
      `INSERT INTO psr_access_grants
         (portable_record_uuid, grantee_school_code, granted_by_user_id, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING grant_id::text, granted_at`,
      [uuid, input.granteeSchoolCode, input.callerUserId, input.reason],
    );
    const r = rows[0]!;
    await this.audit.record({
      actor_user_id: input.callerUserId,
      action: 'psr.grant.created',
      target_type: 'psr',
      target_id: uuid,
      metadata: { grantee_school_code: input.granteeSchoolCode },
    });
    return {
      grant_id: Number(r.grant_id),
      portable_record_uuid: uuid,
      grantee_school_code: input.granteeSchoolCode,
      granted_by_user_id: input.callerUserId,
      reason: input.reason,
      granted_at: r.granted_at.toISOString(),
      revoked_at: null,
    };
  }

  /** Owner revokes a previously-granted access. */
  async revokeGrant(input: { callerUserId: number; grantId: number }): Promise<void> {
    const uuid = await this.uuidForUser(input.callerUserId);
    if (!uuid) throw new NotFoundException('no student record for caller');

    const { rowCount } = await this.db.query(
      `UPDATE psr_access_grants
          SET revoked_at = NOW()
        WHERE grant_id = $1
          AND portable_record_uuid = $2
          AND revoked_at IS NULL`,
      [input.grantId, uuid],
    );
    if ((rowCount ?? 0) === 0) {
      throw new NotFoundException('grant not found or already revoked');
    }
    await this.audit.record({
      actor_user_id: input.callerUserId,
      action: 'psr.grant.revoked',
      target_type: 'psr',
      target_id: uuid,
      metadata: { grant_id: input.grantId },
    });
  }

  /** List all grants the owner has issued (active and revoked). */
  async listOwnGrants(callerUserId: number): Promise<PsrAccessGrant[]> {
    const uuid = await this.uuidForUser(callerUserId);
    if (!uuid) return [];
    const { rows } = await this.db.query<{
      grant_id: string;
      portable_record_uuid: string;
      grantee_school_code: string;
      granted_by_user_id: number;
      reason: string | null;
      granted_at: Date;
      revoked_at: Date | null;
    }>(
      `SELECT grant_id::text, portable_record_uuid, grantee_school_code,
              granted_by_user_id, reason, granted_at, revoked_at
         FROM psr_access_grants
        WHERE portable_record_uuid = $1
        ORDER BY granted_at DESC`,
      [uuid],
    );
    return rows.map((r) => ({
      grant_id: Number(r.grant_id),
      portable_record_uuid: r.portable_record_uuid,
      grantee_school_code: r.grantee_school_code,
      granted_by_user_id: r.granted_by_user_id,
      reason: r.reason,
      granted_at: r.granted_at.toISOString(),
      revoked_at: r.revoked_at ? r.revoked_at.toISOString() : null,
    }));
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async uuidForUser(userId: number): Promise<string | null> {
    const { rows } = await this.db.query<{ portable_record_uuid: string }>(
      `SELECT portable_record_uuid FROM students WHERE user_id = $1`,
      [userId],
    );
    return rows[0]?.portable_record_uuid ?? null;
  }

  /**
   * Authorization check for cross-school PSR reads.
   *
   * Returns true iff:
   *   - caller is PLATFORM_ADMIN, OR
   *   - caller is SCHOOL_ADMIN at the student's CURRENT school, OR
   *   - caller's org holds an active (non-revoked) grant for this uuid.
   */
  private async canRead(
    targetUuid: string,
    callerRole: UserRole,
    callerOrganizationCode: string | null,
  ): Promise<boolean> {
    if (callerRole === 'PLATFORM_ADMIN') return true;
    if (!callerOrganizationCode) return false;

    // SCHOOL_ADMIN at the student's current school can always read.
    if (callerRole === 'SCHOOL_ADMIN') {
      const { rows } = await this.db.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM students s
             JOIN schools sc ON sc.school_id = s.school_id
            WHERE s.portable_record_uuid = $1
              AND sc.school_code = $2
         ) AS exists`,
        [targetUuid, callerOrganizationCode],
      );
      if (rows[0]?.exists) return true;
    }

    // Any role with an active grant for this uuid scoped to the caller's org.
    const { rows: grants } = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM psr_access_grants
          WHERE portable_record_uuid = $1
            AND grantee_school_code = $2
            AND revoked_at IS NULL
       ) AS exists`,
      [targetUuid, callerOrganizationCode],
    );
    return grants[0]?.exists ?? false;
  }

  /**
   * Public wrapper around the assembly logic for callers that have ALREADY
   * authorised the read through their own ACL (e.g. ParentService, which
   * checks the parent_child_link). The caller is responsible for writing
   * the audit_log entry — this method does NOT.
   */
  async assembleByUuid(uuid: string): Promise<PortableStudentRecord> {
    return this.assemble(uuid);
  }

  private async assemble(uuid: string): Promise<PortableStudentRecord> {
    const identity = await this.identity(uuid);
    if (!identity) throw new NotFoundException('PSR not found');
    const [grades, olympiads, cpd] = await Promise.all([
      this.grades(uuid),
      this.olympiads(uuid),
      this.teacherCpd(uuid),
    ]);
    return {
      identity,
      grades,
      olympiads,
      teacher_cpd: cpd,
    };
  }

  private async identity(uuid: string): Promise<PsrIdentity | null> {
    const { rows } = await this.db.query<{
      portable_record_uuid: string;
      display_name: string;
      current_school_code: string | null;
      current_school_name: string | null;
      grade: number | null;
      is_boarding: boolean;
    }>(
      `SELECT s.portable_record_uuid,
              COALESCE(u.email, '#' || s.student_id::text) AS display_name,
              sc.school_code AS current_school_code,
              sc.name AS current_school_name,
              s.grade,
              COALESCE(s.is_boarding, FALSE) AS is_boarding
         FROM students s
         JOIN users u ON u.user_id = s.user_id
    LEFT JOIN schools sc ON sc.school_id = s.school_id
        WHERE s.portable_record_uuid = $1`,
      [uuid],
    );
    return rows[0] ?? null;
  }

  private async grades(uuid: string): Promise<PsrGradeEntry[]> {
    const { rows } = await this.db.query<{
      test_id: string;
      subject: string;
      test_type: string;
      score: number;
      max_score: number;
      percentile: string | null;
      taken_at: Date;
    }>(
      `SELECT mt.result_id::text AS test_id,
              mt.subject,
              mt.test_type::text,
              mt.score,
              mt.max_score,
              mt.percentile::text,
              mt.taken_at
         FROM mock_test_results mt
         JOIN students s ON s.student_id = mt.student_id
        WHERE s.portable_record_uuid = $1
        ORDER BY mt.taken_at DESC
        LIMIT 100`,
      [uuid],
    );
    return rows.map((r) => ({
      test_id: Number(r.test_id),
      subject: r.subject,
      test_type: r.test_type,
      score: r.score,
      max_score: r.max_score,
      percentile: r.percentile === null ? null : Number(r.percentile),
      taken_at: r.taken_at.toISOString(),
    }));
  }

  private async olympiads(uuid: string): Promise<PsrOlympiadEntry[]> {
    const { rows } = await this.db.query<{
      registration_id: number;
      olympiad_id: number;
      title: string;
      organizer: string;
      subject: string;
      exam_date: Date;
      payment_status: string;
    }>(
      `SELECT r.registration_id, o.olympiad_id, o.title, o.organizer, o.subject,
              o.exam_date, r.payment_status::text
         FROM registrations r
         JOIN students s  ON s.student_id = r.student_id
         JOIN olympiads o ON o.olympiad_id = r.olympiad_id
        WHERE s.portable_record_uuid = $1
        ORDER BY o.exam_date DESC
        LIMIT 100`,
      [uuid],
    );
    return rows.map((r) => ({
      registration_id: r.registration_id,
      olympiad_id: r.olympiad_id,
      title: r.title,
      organizer: r.organizer,
      subject: r.subject,
      exam_date: r.exam_date.toISOString(),
      payment_status: r.payment_status,
    }));
  }

  private async teacherCpd(uuid: string): Promise<PsrTeacherCpdEntry[]> {
    // Only present if the user is dual-role (teacher + their own student
    // record). academy_certifications is keyed by teacher_user_id which
    // matches students.user_id in that case.
    const { rows } = await this.db.query<{
      certification_id: string;
      course_title: string;
      cpd_credits: string;
      moe_endorsed: boolean;
      issued_at: Date;
    }>(
      `SELECT ac.certification_id::text,
              c.title AS course_title,
              ac.cpd_credits::text AS cpd_credits,
              ac.moe_endorsed,
              ac.issued_at
         FROM academy_certifications ac
         JOIN academy_courses c ON c.course_id = ac.course_id
         JOIN students s ON s.user_id = ac.teacher_user_id
        WHERE s.portable_record_uuid = $1
        ORDER BY ac.issued_at DESC`,
      [uuid],
    );
    return rows.map((r) => ({
      certification_id: Number(r.certification_id),
      course_title: r.course_title,
      cpd_credits: Number(r.cpd_credits),
      moe_endorsed: r.moe_endorsed,
      issued_at: r.issued_at.toISOString(),
    }));
  }
}
