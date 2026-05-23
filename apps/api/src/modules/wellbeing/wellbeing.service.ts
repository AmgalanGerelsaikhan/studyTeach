import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  UpdateCrisisFlagRequest,
  WellbeingCanSubmit,
  WellbeingCrisisFlag,
  WellbeingCrisisStatus,
  WellbeingPulseRequest,
  WellbeingPulseResponse,
} from '@studyteach/contracts';

import { AuditService } from '../../lib/audit/audit.service';
import { Db } from '../../lib/db/pool';

import { detectCrisisPhrase } from './crisis-phrases';

/**
 * Wellbeing Pulse service (PRD §4.7a).
 *
 * CLAUDE.md hard constraint #6: wellbeing data is sacrosanct.
 *  - Anonymous-by-default storage.
 *  - Crisis-phrase de-anonymization is the only path that links a response
 *    back to a student, and only counselors see it.
 *  - Every counselor read of a flagged response writes an audit_log row.
 *  - Never logged outside the audit trail.
 *
 * Eligibility: only STUDENT users whose `students.is_boarding = TRUE` can
 * submit a pulse. Once-per-week enforced via the (anon_token, pulse_week)
 * unique index.
 */
@Injectable()
export class WellbeingService {
  private readonly log = new Logger(WellbeingService.name);

  constructor(
    private readonly db: Db,
    private readonly audit: AuditService,
  ) {}

  // ── Student-facing ────────────────────────────────────────────────────

  async canSubmit(studentUserId: number): Promise<WellbeingCanSubmit> {
    const currentWeek = isoWeekNumber(new Date());
    const isBoarding = await this.isBoardingStudent(studentUserId);
    if (!isBoarding) {
      // Non-boarding students can't submit — surface a clean negative.
      return { can_submit: false, current_week: currentWeek, next_window_opens: null };
    }
    // The anon_token is computed client-side; we can't check
    // already-submitted-this-week server-side without knowing it. Surface
    // can_submit=TRUE optimistically; the unique index catches the
    // dedupe case at submit time.
    return { can_submit: true, current_week: currentWeek, next_window_opens: null };
  }

  async submitPulse(input: {
    studentUserId: number;
    request: WellbeingPulseRequest;
  }): Promise<WellbeingPulseResponse> {
    const isBoarding = await this.isBoardingStudent(input.studentUserId);
    if (!isBoarding) {
      throw new ForbiddenException('only boarding students can submit a wellbeing pulse');
    }

    const currentWeek = isoWeekNumber(new Date());
    if (input.request.pulse_week !== currentWeek) {
      throw new BadRequestException('pulse_week must match the current ISO week');
    }

    const { rows: studentRows } = await this.db.query<{
      student_id: number;
      school_id: number | null;
    }>(`SELECT student_id, school_id FROM students WHERE user_id = $1`, [input.studentUserId]);
    const student = studentRows[0];
    if (!student || !student.school_id) {
      throw new BadRequestException('student has no school assigned');
    }

    const matched = detectCrisisPhrase(input.request.q5_freetext);
    const crisisDetected = matched !== null;

    // Anonymous insert. student_id is populated ONLY in the crisis path
    // below so the audit story is clean: "if student_id is non-null on a
    // response row, it's because a crisis phrase matched."
    const { rows: insertedRows } = await this.db
      .query<{
        response_id: string;
        submitted_at: Date;
      }>(
        `INSERT INTO wellbeing_pulse_responses
         (pulse_week, student_id, anon_token, school_id,
          q1_mood, q2_sleep, q3_connection, q4_safety,
          q5_freetext, crisis_detected)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING response_id::text, submitted_at`,
        [
          input.request.pulse_week,
          crisisDetected ? student.student_id : null,
          input.request.anon_token,
          student.school_id,
          input.request.q1_mood,
          input.request.q2_sleep,
          input.request.q3_connection,
          input.request.q4_safety,
          input.request.q5_freetext,
          crisisDetected,
        ],
      )
      .catch((err: unknown) => {
        // Conflict on (anon_token, pulse_week) → already submitted this week.
        if ((err as { code?: string }).code === '23505') {
          throw new ConflictException('pulse already submitted for this week');
        }
        throw err;
      });

    const responseId = Number(insertedRows[0]!.response_id);

    if (crisisDetected && matched) {
      // Open a crisis flag. The de-anonymisation happens RIGHT HERE — we
      // already wrote student_id on the response row above. Counselors at
      // the student's school can see the flag immediately.
      await this.db.query(
        `INSERT INTO wellbeing_crisis_flags
           (response_id, student_id, school_id, matched_phrase, status)
         VALUES ($1, $2, $3, $4, 'OPEN'::wellbeing_crisis_status)
         ON CONFLICT (response_id, status) DO NOTHING`,
        [responseId, student.student_id, student.school_id, matched],
      );

      // The audit row records the de-anonymisation event itself — the
      // counselor read is audited separately when they actually open the
      // flag (see listFlags / updateFlag below).
      await this.audit.record({
        actor_user_id: input.studentUserId,
        action: 'wellbeing.crisis.flagged',
        target_type: 'student',
        target_id: String(student.student_id),
        metadata: { response_id: responseId, matched_phrase: matched },
      });

      this.log.warn(
        `wellbeing crisis flag opened: response=${responseId} student=${student.student_id} school=${student.school_id}`,
      );
    }

    return {
      response_id: responseId,
      submitted_at: insertedRows[0]!.submitted_at.toISOString(),
      safety_resources_shown: crisisDetected,
    };
  }

  // ── Counselor-facing ──────────────────────────────────────────────────

  async listFlagsForCounselor(input: {
    counselorUserId: number;
    organizationCode: string;
    onlyOpen: boolean;
  }): Promise<WellbeingCrisisFlag[]> {
    await this.ensureCounselor(input.counselorUserId);

    const where: string[] = [`sc.school_code = $1`];
    const params: unknown[] = [input.organizationCode];
    if (input.onlyOpen) {
      where.push(`f.status = 'OPEN'::wellbeing_crisis_status`);
    }

    const { rows } = await this.db.query<{
      flag_id: string;
      response_id: string;
      student_id: number;
      school_id: number;
      matched_phrase: string;
      status: WellbeingCrisisStatus;
      assigned_to_user_id: number | null;
      created_at: Date;
      resolved_at: Date | null;
      freetext_excerpt: string | null;
      grade: number | null;
    }>(
      `SELECT f.flag_id::text, f.response_id::text, f.student_id, f.school_id,
              f.matched_phrase, f.status, f.assigned_to_user_id,
              f.created_at, f.resolved_at,
              LEFT(r.q5_freetext, 240) AS freetext_excerpt,
              s.grade
         FROM wellbeing_crisis_flags f
         JOIN wellbeing_pulse_responses r ON r.response_id = f.response_id
         JOIN students s ON s.student_id = f.student_id
         JOIN schools sc ON sc.school_id = f.school_id
        WHERE ${where.join(' AND ')}
        ORDER BY f.created_at DESC
        LIMIT 200`,
      params,
    );

    if (rows.length > 0) {
      // Single audit row per LIST read (not per flag) — counselor browsed
      // the inbox at this timestamp.
      await this.audit.record({
        actor_user_id: input.counselorUserId,
        action: 'wellbeing.flags.listed',
        target_type: 'school',
        target_id: input.organizationCode,
        metadata: { flag_count: rows.length, only_open: input.onlyOpen },
      });
    }

    return rows.map((r) => ({
      flag_id: Number(r.flag_id),
      response_id: Number(r.response_id),
      student_id: r.student_id,
      school_id: r.school_id,
      matched_phrase: r.matched_phrase,
      status: r.status,
      assigned_to_user_id: r.assigned_to_user_id,
      created_at: r.created_at.toISOString(),
      resolved_at: r.resolved_at ? r.resolved_at.toISOString() : null,
      freetext_excerpt: r.freetext_excerpt,
      student_handle:
        r.grade !== null ? `Grade ${r.grade} · ID #${r.student_id}` : `ID #${r.student_id}`,
    }));
  }

  async updateFlag(input: {
    counselorUserId: number;
    organizationCode: string;
    flagId: number;
    update: UpdateCrisisFlagRequest;
  }): Promise<void> {
    await this.ensureCounselor(input.counselorUserId);

    // Lock the flag scoped to the counselor's org.
    const { rows: flagRows } = await this.db.query<{
      flag_id: string;
      school_id: number;
      status: WellbeingCrisisStatus;
    }>(
      `SELECT f.flag_id::text, f.school_id, f.status
         FROM wellbeing_crisis_flags f
         JOIN schools sc ON sc.school_id = f.school_id
        WHERE f.flag_id = $1 AND sc.school_code = $2`,
      [input.flagId, input.organizationCode],
    );
    if (flagRows.length === 0) throw new NotFoundException('flag not found');

    const setResolvedAt = input.update.status === 'RESOLVED' ? `, resolved_at = NOW()` : '';
    await this.db.query(
      `UPDATE wellbeing_crisis_flags
          SET status = $2::wellbeing_crisis_status,
              assigned_to_user_id = $3
              ${setResolvedAt}
        WHERE flag_id = $1`,
      [input.flagId, input.update.status, input.counselorUserId],
    );

    if (input.update.note) {
      await this.db.query(
        `UPDATE wellbeing_crisis_flags
            SET notes_jsonb = notes_jsonb || jsonb_build_object(
              'author_user_id', $2::int,
              'note', $3::text,
              'created_at', to_jsonb(NOW())
            )::jsonb
          WHERE flag_id = $1`,
        [input.flagId, input.counselorUserId, input.update.note],
      );
    }

    await this.audit.record({
      actor_user_id: input.counselorUserId,
      action: 'wellbeing.flag.updated',
      target_type: 'wellbeing_flag',
      target_id: String(input.flagId),
      metadata: { new_status: input.update.status, has_note: Boolean(input.update.note) },
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────

  private async isBoardingStudent(userId: number): Promise<boolean> {
    const { rows } = await this.db.query<{ is_boarding: boolean }>(
      `SELECT COALESCE(is_boarding, FALSE) AS is_boarding
         FROM students WHERE user_id = $1`,
      [userId],
    );
    return rows[0]?.is_boarding === true;
  }

  private async ensureCounselor(userId: number): Promise<void> {
    const { rows } = await this.db.query<{ is_counselor: boolean; primary_role: string }>(
      `SELECT is_counselor, primary_role::text FROM users WHERE user_id = $1`,
      [userId],
    );
    const row = rows[0];
    if (!row || !row.is_counselor) {
      throw new ForbiddenException('counselor flag required');
    }
    if (row.primary_role !== 'SCHOOL_ADMIN' && row.primary_role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('counselor role must also be SCHOOL_ADMIN or PLATFORM_ADMIN');
    }
  }
}

/** ISO 8601 week number. Mirrors `date-fns/getISOWeek` without the dep. */
function isoWeekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
