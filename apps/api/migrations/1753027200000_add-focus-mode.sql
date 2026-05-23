-- Migration: Focus Mode (PRD §4.6, P1).
--
-- Teacher-initiated, time-bounded "single-activity lock" session that students
-- join with a 6-character code. While active, the student client restricts
-- navigation to the assigned activity and the AI Tutor refuses off-topic
-- questions. Anonymous engagement summary is emitted post-session.
--
-- Tables:
--   focus_sessions     — one row per teacher-created session.
--   focus_participants — one row per (session, student) pair; rejoins are
--                        idempotent thanks to UNIQUE (session_id, student_user_id).
--
-- Multi-tenant: organization_code is snapshotted on the session row from the
-- creating teacher; cross-tenant joins are forbidden in the service layer
-- (a student can only join a session whose org matches their own).

CREATE TYPE focus_session_activity_kind AS ENUM (
  'AI_TUTOR',
  'EGSH_PRACTICE',
  'ACADEMY_LESSON',
  'CURRICULUM_READING'
);

CREATE TABLE focus_sessions (
  session_id        BIGSERIAL PRIMARY KEY,
  teacher_user_id   INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  -- Snapshot of the creating teacher's organization_code. Lets us scope the
  -- join lookup without a join through users() on every request.
  organization_code TEXT        NOT NULL,
  -- 6-char uppercase alphanumeric join code. Reusable only AFTER the session
  -- ends (see the partial unique index below).
  code              CHAR(6)     NOT NULL,
  activity_kind     focus_session_activity_kind NOT NULL,
  -- Opaque per-kind payload, e.g. {"topic": "physics-force-moments"} for
  -- AI_TUTOR or {"lesson_id": 17} for ACADEMY_LESSON. Validated by the Zod
  -- discriminated union in the contracts layer; DB only sees JSONB.
  activity_ref      JSONB       NOT NULL,
  scheduled_end     TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ NULL,
  ended_by          INTEGER     NULL REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Codes are reusable only after a session ends. The partial unique index
-- guarantees a fresh teacher session never collides with a still-live code.
CREATE UNIQUE INDEX idx_focus_sessions_active_code
  ON focus_sessions (code)
  WHERE ended_at IS NULL;

CREATE INDEX idx_focus_sessions_teacher_recent
  ON focus_sessions (teacher_user_id, created_at DESC);

CREATE TABLE focus_participants (
  participant_id   BIGSERIAL PRIMARY KEY,
  session_id       BIGINT      NOT NULL REFERENCES focus_sessions(session_id) ON DELETE CASCADE,
  student_user_id  INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at          TIMESTAMPTZ NULL,
  -- One of: 'session_ended', 'teacher_closed', 'student_left', 'timeout'.
  -- Free-text rather than an enum because we expect to add reasons later
  -- (e.g. 'crisis_redirect' once Wellbeing Pulse lands) without a migration.
  leave_reason     TEXT        NULL,
  -- Idempotent rejoin: a second POST /focus/sessions/join with the same code
  -- ON CONFLICT-updates the existing row rather than inserting a duplicate.
  UNIQUE (session_id, student_user_id)
);

-- Live-counter query: count of participants where left_at IS NULL.
CREATE INDEX idx_focus_participants_live
  ON focus_participants (session_id)
  WHERE left_at IS NULL;
