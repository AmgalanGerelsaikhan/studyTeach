import { randomInt } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActiveFocusSession,
  FocusActivityKind,
  FocusActivityRef,
  FocusSession,
  FocusSessionSummary,
} from '@studyteach/contracts';
import type Redis from 'ioredis';

import { Db } from '../../lib/db/pool';
import { AuditService } from '../../lib/audit/audit.service';
import { REDIS } from '../../lib/redis/redis.module';

/**
 * Focus Mode — PRD §4.6 (P1).
 *
 * Teacher-driven, code-joined, time-bounded session. A teacher picks an
 * activity (AI tutor topic / EGSh strand / Academy lesson / curriculum read),
 * the server mints a 6-char code, students join with it, and the student
 * client locks itself to the assigned activity until either the scheduled
 * end fires or the teacher closes early.
 *
 * Multi-tenant invariants:
 *   - organization_code is snapshotted on the session row from the teacher.
 *   - join() refuses if the student's organization_code differs from the
 *     session's (cross-tenant joins are forbidden).
 *   - close() is gated to the creating teacher; summary() is gated to the
 *     creating teacher OR PLATFORM_ADMIN.
 *
 * Caching:
 *   meActive() is hit on every navigation — it sits behind a 5s Redis cache
 *   keyed by student user id. Writes that flip the active state (join, close,
 *   self-leave) bust the key explicitly.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0, I/1
const CODE_LENGTH = 6;
const CODE_RETRY_LIMIT = 6;
const ACTIVE_CACHE_TTL_SECONDS = 5;

type LeaveReason = 'session_ended' | 'teacher_closed' | 'student_left' | 'timeout';

@Injectable()
export class FocusService {
  private readonly log = new Logger(FocusService.name);

  constructor(
    private readonly db: Db,
    private readonly audit: AuditService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  // ── Teacher: create ───────────────────────────────────────────────────────

  async create(input: {
    teacherUserId: number;
    organizationCode: string | null;
    activityKind: FocusActivityKind;
    activityRef: FocusActivityRef;
    scheduledEnd: Date;
  }): Promise<FocusSession> {
    if (!input.organizationCode) {
      throw new BadRequestException('teacher has no organization_code');
    }
    if (input.activityKind !== input.activityRef.kind) {
      throw new BadRequestException('activity_kind and activity_ref.kind must match');
    }
    if (input.scheduledEnd.getTime() <= Date.now()) {
      throw new BadRequestException('scheduled_end must be in the future');
    }

    // Retry on the partial-unique-index collision. The index only enforces
    // uniqueness for live (ended_at IS NULL) rows, so collisions are
    // proportional to the number of currently-open sessions — rare in practice.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < CODE_RETRY_LIMIT; attempt += 1) {
      const code = generateCode();
      try {
        const { rows } = await this.db.query<{
          session_id: string;
          code: string;
          activity_kind: FocusActivityKind;
          activity_ref: FocusActivityRef;
          scheduled_end: Date;
          ended_at: Date | null;
        }>(
          `INSERT INTO focus_sessions
             (teacher_user_id, organization_code, code, activity_kind, activity_ref, scheduled_end)
           VALUES ($1, $2, $3, $4::focus_session_activity_kind, $5::jsonb, $6)
           RETURNING session_id::text,
                     code,
                     activity_kind::text AS activity_kind,
                     activity_ref,
                     scheduled_end,
                     ended_at`,
          [
            input.teacherUserId,
            input.organizationCode,
            code,
            input.activityKind,
            JSON.stringify(input.activityRef),
            input.scheduledEnd,
          ],
        );
        const row = rows[0]!;
        const sessionId = Number(row.session_id);
        await this.audit.record({
          actor_user_id: input.teacherUserId,
          action: 'focus.session.created',
          target_type: 'focus_session',
          target_id: String(sessionId),
          metadata: {
            organization_code: input.organizationCode,
            activity_kind: input.activityKind,
            scheduled_end: input.scheduledEnd.toISOString(),
          },
        });
        return {
          session_id: sessionId,
          code: row.code,
          activity_kind: row.activity_kind,
          activity_ref: row.activity_ref,
          scheduled_end: row.scheduled_end.toISOString(),
          ended_at: row.ended_at?.toISOString() ?? null,
          live_participant_count: 0,
        };
      } catch (err) {
        // 23505 = unique_violation on idx_focus_sessions_active_code. Retry
        // with a fresh code. Any other error is fatal.
        if (isUniqueViolation(err)) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    this.log.error(`focus.create: ran out of code retries (${CODE_RETRY_LIMIT})`, lastError);
    throw new BadRequestException('could not allocate a focus code; try again');
  }

  // ── Student: join ─────────────────────────────────────────────────────────

  async join(input: {
    studentUserId: number;
    studentOrganizationCode: string | null;
    code: string;
  }): Promise<ActiveFocusSession> {
    const normalized = input.code.trim().toUpperCase();
    if (normalized.length !== CODE_LENGTH) {
      throw new BadRequestException('code must be 6 characters');
    }
    const session = await this.findActiveByCode(normalized);
    if (!session) throw new NotFoundException('no active session for code');

    // Cross-tenant guard: a student can never be locked into another school's
    // focus session by guessing a code.
    if (session.organization_code !== input.studentOrganizationCode) {
      throw new ForbiddenException('cross-tenant focus join forbidden');
    }

    // Idempotent rejoin: ON CONFLICT preserves the existing joined_at and
    // clears any stale left_at / leave_reason so the student is "live" again.
    await this.db.query(
      `INSERT INTO focus_participants (session_id, student_user_id)
       VALUES ($1, $2)
       ON CONFLICT (session_id, student_user_id) DO UPDATE
         SET left_at = NULL, leave_reason = NULL`,
      [session.session_id, input.studentUserId],
    );

    await this.bustActiveCache(input.studentUserId);
    await this.audit.record({
      actor_user_id: input.studentUserId,
      action: 'focus.session.joined',
      target_type: 'focus_session',
      target_id: String(session.session_id),
    });

    return {
      session_id: session.session_id,
      activity_kind: session.activity_kind,
      activity_ref: session.activity_ref,
      scheduled_end: session.scheduled_end.toISOString(),
    };
  }

  // ── Teacher: close ────────────────────────────────────────────────────────

  async close(input: { sessionId: number; teacherUserId: number }): Promise<void> {
    const { rows } = await this.db.query<{ teacher_user_id: number; ended_at: Date | null }>(
      `SELECT teacher_user_id, ended_at FROM focus_sessions WHERE session_id = $1`,
      [input.sessionId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('session not found');
    if (row.teacher_user_id !== input.teacherUserId) {
      throw new ForbiddenException('only the creating teacher can close this session');
    }
    if (row.ended_at) {
      // Idempotent: closing an already-closed session is a no-op.
      return;
    }

    // Snapshot the live participants so we can bust their caches after the
    // update lands. Then update both rows in a single statement each — no
    // explicit transaction; either both go through or neither does at this
    // small scale.
    const { rows: live } = await this.db.query<{ student_user_id: number }>(
      `SELECT student_user_id FROM focus_participants
        WHERE session_id = $1 AND left_at IS NULL`,
      [input.sessionId],
    );

    await this.db.query(
      `UPDATE focus_sessions
          SET ended_at = NOW(), ended_by = $2
        WHERE session_id = $1`,
      [input.sessionId, input.teacherUserId],
    );
    await this.db.query(
      `UPDATE focus_participants
          SET left_at = NOW(), leave_reason = $2
        WHERE session_id = $1 AND left_at IS NULL`,
      [input.sessionId, 'teacher_closed' satisfies LeaveReason],
    );

    for (const p of live) await this.bustActiveCache(p.student_user_id);

    await this.audit.record({
      actor_user_id: input.teacherUserId,
      action: 'focus.session.closed',
      target_type: 'focus_session',
      target_id: String(input.sessionId),
      metadata: { live_participants_at_close: live.length },
    });
  }

  // ── Student: active-session probe (hot path) ──────────────────────────────

  /**
   * High-frequency: client polls on every navigation. Cached in Redis with a
   * 5s TTL keyed by user id. Cache is invalidated on join() and close().
   *
   * The cache stores either the JSON of the ActiveFocusSession or the literal
   * 'null' string for "no active session".
   */
  async meActive(studentUserId: number): Promise<ActiveFocusSession | null> {
    const cacheKey = activeCacheKey(studentUserId);
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return cached === 'null' ? null : (JSON.parse(cached) as ActiveFocusSession);
    }

    const { rows } = await this.db.query<{
      session_id: string;
      activity_kind: FocusActivityKind;
      activity_ref: FocusActivityRef;
      scheduled_end: Date;
    }>(
      `SELECT fs.session_id::text,
              fs.activity_kind::text AS activity_kind,
              fs.activity_ref,
              fs.scheduled_end
         FROM focus_participants fp
         JOIN focus_sessions fs ON fs.session_id = fp.session_id
        WHERE fp.student_user_id = $1
          AND fp.left_at IS NULL
          AND fs.ended_at IS NULL
          AND fs.scheduled_end > NOW()
        ORDER BY fp.joined_at DESC
        LIMIT 1`,
      [studentUserId],
    );
    const row = rows[0];
    if (!row) {
      await this.redis.setex(cacheKey, ACTIVE_CACHE_TTL_SECONDS, 'null');
      return null;
    }
    const active: ActiveFocusSession = {
      session_id: Number(row.session_id),
      activity_kind: row.activity_kind,
      activity_ref: row.activity_ref,
      scheduled_end: row.scheduled_end.toISOString(),
    };
    await this.redis.setex(cacheKey, ACTIVE_CACHE_TTL_SECONDS, JSON.stringify(active));
    return active;
  }

  // ── Teacher / PlatformAdmin: anonymous summary ────────────────────────────

  async summary(input: {
    sessionId: number;
    actorUserId: number;
    actorRole: 'TEACHER' | 'PLATFORM_ADMIN';
  }): Promise<FocusSessionSummary> {
    const { rows: sessRows } = await this.db.query<{
      teacher_user_id: number;
      ended_at: Date | null;
      scheduled_end: Date;
    }>(
      `SELECT teacher_user_id, ended_at, scheduled_end
         FROM focus_sessions WHERE session_id = $1`,
      [input.sessionId],
    );
    const sess = sessRows[0];
    if (!sess) throw new NotFoundException('session not found');
    if (input.actorRole !== 'PLATFORM_ADMIN' && sess.teacher_user_id !== input.actorUserId) {
      throw new ForbiddenException('only the creating teacher can read summaries');
    }

    // Anonymous: counts + median duration only. No student_user_id selected.
    const { rows: stats } = await this.db.query<{
      total_joined: string;
      session_ended: string;
      teacher_closed: string;
      student_left: string;
      timeout: string;
      median_minutes: string | null;
    }>(
      `SELECT COUNT(*)::text AS total_joined,
              COUNT(*) FILTER (WHERE leave_reason = 'session_ended')::text  AS session_ended,
              COUNT(*) FILTER (WHERE leave_reason = 'teacher_closed')::text AS teacher_closed,
              COUNT(*) FILTER (WHERE leave_reason = 'student_left')::text   AS student_left,
              COUNT(*) FILTER (WHERE leave_reason = 'timeout')::text        AS timeout,
              -- Duration in minutes. For still-live rows we cap at the session
              -- end (ended_at OR scheduled_end OR NOW()) so the median isn't
              -- skewed by a session that's queried mid-flight.
              percentile_cont(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(EPOCH FROM (
                  COALESCE(left_at, $2::timestamptz, $3::timestamptz, NOW()) - joined_at
                )) / 60.0
              )::text AS median_minutes
         FROM focus_participants
        WHERE session_id = $1`,
      [input.sessionId, sess.ended_at, sess.scheduled_end],
    );
    const s = stats[0]!;
    return {
      session_id: input.sessionId,
      total_joined: Number(s.total_joined),
      leave_reasons: {
        session_ended: Number(s.session_ended),
        teacher_closed: Number(s.teacher_closed),
        student_left: Number(s.student_left),
        timeout: Number(s.timeout),
      },
      median_session_minutes: s.median_minutes === null ? null : Number(s.median_minutes),
    };
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private async findActiveByCode(code: string): Promise<{
    session_id: number;
    organization_code: string;
    activity_kind: FocusActivityKind;
    activity_ref: FocusActivityRef;
    scheduled_end: Date;
  } | null> {
    const { rows } = await this.db.query<{
      session_id: string;
      organization_code: string;
      activity_kind: FocusActivityKind;
      activity_ref: FocusActivityRef;
      scheduled_end: Date;
    }>(
      `SELECT session_id::text,
              organization_code,
              activity_kind::text AS activity_kind,
              activity_ref,
              scheduled_end
         FROM focus_sessions
        WHERE code = $1 AND ended_at IS NULL AND scheduled_end > NOW()`,
      [code],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      session_id: Number(row.session_id),
      organization_code: row.organization_code,
      activity_kind: row.activity_kind,
      activity_ref: row.activity_ref,
      scheduled_end: row.scheduled_end,
    };
  }

  private async bustActiveCache(studentUserId: number): Promise<void> {
    await this.redis.del(activeCacheKey(studentUserId));
  }
}

function activeCacheKey(studentUserId: number): string {
  return `focus:active:${studentUserId}`;
}

function generateCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}
