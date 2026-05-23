import { randomBytes, randomInt } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  ChildSummary,
  LinkedChild,
  MockTrajectoryPoint,
  ParentAuditEntry,
  PaymentRecord,
  UpcomingOlympiad,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';
import { AuditService } from '../../lib/audit/audit.service';
import { SmsService } from '../sms/sms.service';

/**
 * Parent Portal service — PRD §4.8 (web subset, USSD deferred).
 *
 * Flow:
 *   1. POST /parent/links: parent gives (national_id_hash, school_code).
 *      Server resolves the matching student, persists a PENDING link, mints
 *      an OTP, sends it via SmsService to the parent's registered phone.
 *   2. POST /parent/links/:id/verify: parent submits the 6-digit code; on
 *      match the link flips to VERIFIED and the OTP is cleared.
 *   3. GET /parent/children: returns every VERIFIED link.
 *   4. GET /parent/children/:student_id/summary: aggregated child view; every
 *      read writes an audit_log row (CLAUDE.md hard constraint #6 audit).
 *   5. POST /parent/links/:id/revoke: marks the link REVOKED, drops the
 *      session cache. A school-wide revoke (POST /parent/revoke-school) flips
 *      every link the parent has at that school.
 */
const OTP_TTL_SECONDS = 5 * 60;

@Injectable()
export class ParentService {
  private readonly log = new Logger(ParentService.name);

  constructor(
    private readonly db: Db,
    private readonly sms: SmsService,
    private readonly audit: AuditService,
  ) {}

  async createLink(input: {
    parentUserId: number;
    parentPhone: string;
    nationalIdHash: string;
    schoolCode: string;
  }): Promise<{ link_id: number; otp_challenge: string }> {
    // Resolve the target student. Multi-tenant scoping: the student must be
    // at the school the parent named — prevents enumeration of unrelated
    // schools' kids by national-ID-hash guessing.
    const { rows: studentRows } = await this.db.query<{ student_id: number }>(
      `SELECT s.student_id
         FROM students s
         JOIN schools sc ON sc.school_id = s.school_id
        WHERE s.national_id_hash = $1
          AND sc.school_code = $2`,
      [input.nationalIdHash, input.schoolCode],
    );
    const student = studentRows[0];
    if (!student) {
      throw new NotFoundException('no matching student at that school');
    }

    // Refuse if a VERIFIED link already exists.
    const { rows: existing } = await this.db.query<{ link_id: number }>(
      `SELECT link_id FROM parent_child_links
        WHERE parent_user_id = $1 AND student_id = $2 AND status = 'VERIFIED'`,
      [input.parentUserId, student.student_id],
    );
    if (existing[0]) {
      throw new BadRequestException('link already verified');
    }

    const challenge = randomBytes(16).toString('hex');
    const code = String(randomInt(100000, 1000000));
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // Replace any stale PENDING row so the flow can be retried cleanly.
    await this.db.query(
      `DELETE FROM parent_child_links
        WHERE parent_user_id = $1 AND student_id = $2 AND status = 'PENDING'`,
      [input.parentUserId, student.student_id],
    );

    const { rows: linkRows } = await this.db.query<{ link_id: string }>(
      `INSERT INTO parent_child_links
         (parent_user_id, student_id, national_id_hash, school_code,
          status, otp_challenge, otp_expires_at)
       VALUES ($1, $2, $3, $4, 'PENDING'::parent_link_status, $5, $6)
       RETURNING link_id::text`,
      [
        input.parentUserId,
        student.student_id,
        input.nationalIdHash,
        input.schoolCode,
        `${challenge}:${code}`,
        otpExpiresAt,
      ],
    );
    const linkId = Number(linkRows[0]!.link_id);

    await this.sms.send('parent-link-otp', input.parentPhone, { code });
    await this.audit.record({
      actor_user_id: input.parentUserId,
      action: 'parent.link.requested',
      target_type: 'student',
      target_id: String(student.student_id),
      metadata: { link_id: linkId },
    });
    this.log.log(
      `parent link request: user=${input.parentUserId} student=${student.student_id} link=${linkId}`,
    );
    return { link_id: linkId, otp_challenge: challenge };
  }

  async verifyLink(input: {
    parentUserId: number;
    challenge: string;
    code: string;
  }): Promise<LinkedChild> {
    const { rows } = await this.db.query<{
      link_id: string;
      student_id: number;
      otp_challenge: string | null;
      otp_expires_at: Date | null;
    }>(
      `SELECT link_id::text, student_id, otp_challenge, otp_expires_at
         FROM parent_child_links
        WHERE parent_user_id = $1
          AND status = 'PENDING'
          AND otp_challenge LIKE $2 || ':%'`,
      [input.parentUserId, input.challenge],
    );
    const link = rows[0];
    if (!link || !link.otp_challenge || !link.otp_expires_at) {
      throw new NotFoundException('challenge not found');
    }
    const linkIdNum = Number(link.link_id);
    if (link.otp_expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP expired');
    }
    const expectedCode = link.otp_challenge.split(':')[1];
    if (expectedCode !== input.code) {
      throw new UnauthorizedException('invalid OTP');
    }

    await this.db.query(
      `UPDATE parent_child_links
          SET status = 'VERIFIED'::parent_link_status,
              verified_at = NOW(),
              otp_challenge = NULL,
              otp_expires_at = NULL
        WHERE link_id = $1`,
      [linkIdNum],
    );
    await this.audit.record({
      actor_user_id: input.parentUserId,
      action: 'parent.link.verified',
      target_type: 'student',
      target_id: String(link.student_id),
      metadata: { link_id: linkIdNum },
    });

    const linked = await this.linkedChild(linkIdNum);
    if (!linked) throw new NotFoundException('link disappeared after verify');
    return linked;
  }

  async listChildren(parentUserId: number): Promise<LinkedChild[]> {
    const { rows } = await this.db.query<{ link_id: string }>(
      `SELECT link_id::text FROM parent_child_links
        WHERE parent_user_id = $1 AND status = 'VERIFIED'
        ORDER BY verified_at DESC`,
      [parentUserId],
    );
    const out: LinkedChild[] = [];
    for (const r of rows) {
      const child = await this.linkedChild(Number(r.link_id));
      if (child) out.push(child);
    }
    return out;
  }

  async getChildSummary(input: { parentUserId: number; studentId: number }): Promise<ChildSummary> {
    const allowed = await this.ensureVerifiedAccess(input.parentUserId, input.studentId);
    if (!allowed) throw new ForbiddenException('not a verified parent for this child');

    const { rows: studentRows } = await this.db.query<{
      student_id: number;
      user_id: number;
      is_boarding: boolean;
      display_name: string | null;
    }>(
      `SELECT s.student_id, s.user_id, COALESCE(s.is_boarding, FALSE) AS is_boarding,
              COALESCE(u.email, '#' || s.student_id::text) AS display_name
         FROM students s
         JOIN users u ON u.user_id = s.user_id
        WHERE s.student_id = $1`,
      [input.studentId],
    );
    const student = studentRows[0];
    if (!student) throw new NotFoundException('student not found');

    const upcoming = await this.upcomingOlympiads(student.student_id);
    const mocks = await this.recentMocks(student.student_id);
    const payments = await this.recentPayments(student.user_id);

    await this.audit.record({
      actor_user_id: input.parentUserId,
      action: 'parent.summary.read',
      target_type: 'student',
      target_id: String(input.studentId),
    });

    return {
      student_id: student.student_id,
      student_name: student.display_name ?? `#${student.student_id}`,
      upcoming_olympiads: upcoming,
      recent_mocks: mocks,
      payments,
      is_boarding: student.is_boarding,
    };
  }

  async revokeLink(input: { parentUserId: number; linkId: number }): Promise<void> {
    const { rowCount } = await this.db.query(
      `UPDATE parent_child_links
          SET status = 'REVOKED'::parent_link_status,
              revoked_at = NOW()
        WHERE link_id = $1 AND parent_user_id = $2 AND status = 'VERIFIED'`,
      [input.linkId, input.parentUserId],
    );
    if ((rowCount ?? 0) === 0) {
      throw new NotFoundException('verified link not found');
    }
    await this.audit.record({
      actor_user_id: input.parentUserId,
      action: 'parent.link.revoked',
      target_type: 'link',
      target_id: String(input.linkId),
    });
  }

  async revokeSchoolAccess(input: {
    parentUserId: number;
    schoolCode: string;
    reason: string | null;
  }): Promise<{ revoked_count: number }> {
    const { rowCount } = await this.db.query(
      `UPDATE parent_child_links
          SET status = 'REVOKED'::parent_link_status,
              revoked_at = NOW()
        WHERE parent_user_id = $1 AND school_code = $2 AND status = 'VERIFIED'`,
      [input.parentUserId, input.schoolCode],
    );
    await this.db.query(
      `INSERT INTO parent_revocations (parent_user_id, school_code, reason)
       VALUES ($1, $2, $3)`,
      [input.parentUserId, input.schoolCode, input.reason],
    );
    await this.audit.record({
      actor_user_id: input.parentUserId,
      action: 'parent.school.revoked',
      target_type: 'school',
      target_id: input.schoolCode,
      metadata: { revoked_count: rowCount ?? 0 },
    });
    return { revoked_count: rowCount ?? 0 };
  }

  /** Audit timeline: who read which child of this parent, when. */
  async auditTrail(parentUserId: number, limit = 50): Promise<ParentAuditEntry[]> {
    const { rows } = await this.db.query<{
      action: string;
      reader_role: string;
      reader_organization_code: string | null;
      occurred_at: Date;
      metadata: Record<string, unknown> | null;
    }>(
      `SELECT a.action,
              COALESCE(u.primary_role::text, 'SYSTEM') AS reader_role,
              u.organization_code AS reader_organization_code,
              a.created_at AS occurred_at,
              a.metadata
         FROM audit_log a
         LEFT JOIN users u ON u.user_id = a.actor_user_id
        WHERE a.target_type = 'student'
          AND a.target_id IN (
            SELECT student_id::text FROM parent_child_links
             WHERE parent_user_id = $1 AND status = 'VERIFIED'
          )
        ORDER BY a.created_at DESC
        LIMIT $2`,
      [parentUserId, limit],
    );
    return rows.map((r) => ({
      action: r.action,
      reader_role: r.reader_role,
      reader_organization_code: r.reader_organization_code,
      occurred_at: r.occurred_at.toISOString(),
      metadata: r.metadata,
    }));
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async ensureVerifiedAccess(parentUserId: number, studentId: number): Promise<boolean> {
    const { rows } = await this.db.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM parent_child_links
          WHERE parent_user_id = $1 AND student_id = $2 AND status = 'VERIFIED'
       ) AS exists`,
      [parentUserId, studentId],
    );
    return rows[0]?.exists === true;
  }

  private async linkedChild(linkId: number): Promise<LinkedChild | null> {
    const { rows } = await this.db.query<{
      link_id: string;
      student_id: number;
      school_code: string;
      school_name: string;
      grade: number | null;
      is_boarding: boolean;
      verified_at: Date | null;
      display_name: string;
    }>(
      `SELECT pcl.link_id::text, pcl.student_id, pcl.school_code,
              sc.name AS school_name,
              s.grade,
              COALESCE(s.is_boarding, FALSE) AS is_boarding,
              pcl.verified_at,
              COALESCE(u.email, '#' || s.student_id::text) AS display_name
         FROM parent_child_links pcl
         JOIN students s  ON s.student_id = pcl.student_id
         JOIN schools sc  ON sc.school_code = pcl.school_code
         JOIN users u     ON u.user_id = s.user_id
        WHERE pcl.link_id = $1`,
      [linkId],
    );
    const r = rows[0];
    if (!r || !r.verified_at) return null;
    return {
      link_id: Number(r.link_id),
      student_id: r.student_id,
      student_name: r.display_name,
      school_code: r.school_code,
      school_name: r.school_name,
      grade: r.grade,
      is_boarding: r.is_boarding,
      verified_at: r.verified_at.toISOString(),
    };
  }

  private async upcomingOlympiads(studentId: number): Promise<UpcomingOlympiad[]> {
    const { rows } = await this.db.query<{
      olympiad_id: number;
      title: string;
      exam_date: Date;
      payment_status: string;
    }>(
      `SELECT o.olympiad_id, o.title, o.exam_date, r.payment_status::text
         FROM registrations r
         JOIN olympiads o ON o.olympiad_id = r.olympiad_id
        WHERE r.student_id = $1
          AND o.exam_date > NOW()
        ORDER BY o.exam_date ASC
        LIMIT 10`,
      [studentId],
    );
    return rows.map((r) => ({
      olympiad_id: r.olympiad_id,
      title: r.title,
      exam_date: r.exam_date.toISOString(),
      registration_status: mapRegistrationStatus(r.payment_status),
    }));
  }

  private async recentMocks(studentId: number): Promise<MockTrajectoryPoint[]> {
    const { rows } = await this.db.query<{
      test_date: Date;
      subject: string;
      score: number;
    }>(
      `SELECT mt.taken_at AS test_date,
              mt.subject,
              mt.score
         FROM mock_test_results mt
        WHERE mt.student_id = $1
        ORDER BY mt.taken_at DESC
        LIMIT 10`,
      [studentId],
    );
    return rows.map((r) => ({
      test_date: r.test_date.toISOString(),
      subject: r.subject,
      score: r.score,
    }));
  }

  private async recentPayments(userId: number): Promise<PaymentRecord[]> {
    const { rows } = await this.db.query<{
      invoice_id: number;
      amount: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT i.invoice_id,
              i.total_mnt::text AS amount,
              i.payment_status::text AS status,
              i.created_at
         FROM invoices i
        WHERE i.issued_to = $1
        ORDER BY i.created_at DESC
        LIMIT 10`,
      [userId],
    );
    return rows.map((r) => ({
      invoice_id: r.invoice_id,
      amount: Number(r.amount),
      status: r.status,
      created_at: r.created_at.toISOString(),
      description: null,
    }));
  }
}

function mapRegistrationStatus(paymentStatus: string): UpcomingOlympiad['registration_status'] {
  switch (paymentStatus.toUpperCase()) {
    case 'PAID':
      return 'PAID';
    case 'PENDING':
      return 'PENDING_PAYMENT';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'CANCELLED';
    default:
      return 'REGISTERED';
  }
}
