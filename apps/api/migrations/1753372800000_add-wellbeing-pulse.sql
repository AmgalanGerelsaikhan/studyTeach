-- Migration: Wellbeing Pulse (PRD §4.7a, P2).
--
-- CLAUDE.md hard constraint #6: Wellbeing data is sacrosanct. Crisis-phrase
-- de-anonymization is the only de-anonymization path. It is disclosed at
-- consent. Wellbeing data is never used to train AI models. Never logged
-- outside the audit trail.
--
-- Design:
--   - Anonymous by default. `student_id` on `wellbeing_pulse_responses`
--     is NULL until/unless a crisis flag is set, at which point the row
--     is de-anonymised to route the right counselor to the right student.
--   - Per-student-per-week dedup via `anon_token` (random hex computed
--     client-side from student_id + a server-side secret pepper). The
--     server cannot reverse the token, so duplicate detection works
--     without identifying the responder.
--   - Counselor access is gated by `users.is_counselor` (new column).
--     SCHOOL_ADMIN role + `is_counselor = TRUE` → can read flags scoped
--     to their org. Audit on every read.

ALTER TABLE users ADD COLUMN is_counselor BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TYPE wellbeing_crisis_status AS ENUM (
  'OPEN',
  'ACKNOWLEDGED',
  'RESOLVED',
  'ESCALATED'
);

CREATE TABLE wellbeing_pulse_responses (
  response_id     BIGSERIAL PRIMARY KEY,
  pulse_week      INTEGER     NOT NULL,
  -- Anonymous-by-default: NULL until a crisis flag is set, at which point
  -- application code de-anonymises by populating student_id from the
  -- school+anon_token lookup (counselor pathway only).
  student_id      INTEGER     NULL REFERENCES students(student_id) ON DELETE SET NULL,
  anon_token      TEXT        NOT NULL,
  school_id       INTEGER     NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  -- 5-question Likert scale (1=worst, 5=best). Free text on q5 is what
  -- the crisis-phrase classifier examines.
  q1_mood         SMALLINT    NOT NULL CHECK (q1_mood BETWEEN 1 AND 5),
  q2_sleep        SMALLINT    NOT NULL CHECK (q2_sleep BETWEEN 1 AND 5),
  q3_connection   SMALLINT    NOT NULL CHECK (q3_connection BETWEEN 1 AND 5),
  q4_safety       SMALLINT    NOT NULL CHECK (q4_safety BETWEEN 1 AND 5),
  q5_freetext     TEXT        NULL,
  crisis_detected BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One response per (anon_token, week). No PII in the unique key.
  UNIQUE (anon_token, pulse_week)
);

CREATE INDEX idx_wellbeing_responses_school_week
  ON wellbeing_pulse_responses (school_id, pulse_week DESC);
CREATE INDEX idx_wellbeing_responses_crisis
  ON wellbeing_pulse_responses (school_id)
  WHERE crisis_detected = TRUE;

CREATE TABLE wellbeing_crisis_flags (
  flag_id              BIGSERIAL PRIMARY KEY,
  response_id          BIGINT NOT NULL REFERENCES wellbeing_pulse_responses(response_id)
                        ON DELETE CASCADE,
  student_id           INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  school_id            INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
  matched_phrase       TEXT NOT NULL,
  status               wellbeing_crisis_status NOT NULL DEFAULT 'OPEN',
  assigned_to_user_id  INTEGER NULL REFERENCES users(user_id) ON DELETE SET NULL,
  notes_jsonb          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at          TIMESTAMPTZ NULL,
  -- One open flag per response. Re-opening a resolved flag creates a new row.
  UNIQUE (response_id, status)
);

CREATE INDEX idx_wellbeing_flags_school_open
  ON wellbeing_crisis_flags (school_id, created_at DESC)
  WHERE status = 'OPEN';
CREATE INDEX idx_wellbeing_flags_assignee
  ON wellbeing_crisis_flags (assigned_to_user_id, status);
