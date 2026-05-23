-- 0007 · EGSh Prep schema (E-015 + shared mock_test_sessions for E-016 practice).
--
-- Tables:
--   * egsh_papers          — canonical JSON form of one past paper. Body is a
--                            JSONB array of questions; ingest CLI fills it.
--   * mock_test_sessions   — one row per started mock. SHARED by EGSh and
--                            Olympiad practice (test_type ENUM). Carries the
--                            offline-queue idempotency key + the
--                            is_proctored_active bit that AI Tutor reads to
--                            fire `ai-tutor.refusal.exam-mode`.
--   * mock_test_results    — promoted from documented-only into a real table.
--                            Per-strand breakdown lives in per_strand_score
--                            JSONB so the BKT observer can replay it.

-- Up Migration

CREATE TYPE test_type_enum AS ENUM ('EGSH', 'OLYMPIAD_PRACTICE');

CREATE TABLE egsh_papers (
  paper_id    VARCHAR(64) PRIMARY KEY,            -- e.g. "EGSH-2024-PHYSICS"
  subject     VARCHAR(50) NOT NULL,
  year        SMALLINT    NOT NULL CHECK (year BETWEEN 2010 AND 2099),
  lang        VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
  -- Body is a JSONB envelope: { questions: [{ id, prompt, options:[...], answer, strand }] }
  body        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_egsh_papers_subject_year ON egsh_papers (subject, year);

COMMENT ON COLUMN egsh_papers.body IS
  'JSONB envelope: { questions:[{ id, prompt, options[], answer, strand }] }. Ingested by `pnpm --filter @studyteach/api ingest:egsh`.';

CREATE TABLE mock_test_sessions (
  session_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           INT NOT NULL REFERENCES students (student_id) ON DELETE CASCADE,
  test_type            test_type_enum NOT NULL,
  paper_id             VARCHAR(64) REFERENCES egsh_papers (paper_id),
  subject              VARCHAR(50) NOT NULL,
  -- True while the student is taking the test; AI Tutor reads this via
  -- the parallel ai_tutor_sessions.in_active_mock_test bit (which we
  -- update in lockstep when a mock starts/ends).
  is_proctored_active  BOOLEAN NOT NULL DEFAULT FALSE,
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at         TIMESTAMPTZ,
  -- Client UUIDv7 — offline-queue dedup of POST /egsh/mocks.
  idempotency_key      VARCHAR(36) UNIQUE
);

CREATE INDEX idx_mock_sessions_student_started
  ON mock_test_sessions (student_id, started_at DESC);

CREATE TABLE mock_test_results (
  result_id          BIGSERIAL PRIMARY KEY,
  session_id         UUID NOT NULL UNIQUE REFERENCES mock_test_sessions (session_id) ON DELETE CASCADE,
  student_id         INT  NOT NULL REFERENCES students (student_id) ON DELETE CASCADE,
  test_type          test_type_enum NOT NULL,
  subject            VARCHAR(50) NOT NULL,
  score              INTEGER NOT NULL CHECK (score >= 0),
  max_score          INTEGER NOT NULL CHECK (max_score > 0),
  percentile         NUMERIC(5,2),
  -- Per-strand breakdown for BKT replay and the "missed concepts" UI:
  --   { "<strand>": { "correct": int, "wrong": int } }
  per_strand_score   JSONB NOT NULL DEFAULT '{}'::jsonb,
  taken_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT score_within_max CHECK (score <= max_score)
);

CREATE INDEX idx_mock_results_student      ON mock_test_results (student_id, taken_at DESC);
CREATE INDEX idx_mock_results_subject_time ON mock_test_results (subject, taken_at DESC);

COMMENT ON TABLE mock_test_results IS
  'Final score per mock submission. percentile is computed against the cohort at submit time and frozen here (the live percentile endpoint recomputes from this table).';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
