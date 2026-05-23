-- Migration: AI Application Coach (PRD §4.10c, P2).
--
-- Personal-statement critique + paragraph rewrite suggestions + mock interview
-- generation for the named scholarship rotation (MEXT / Chevening / KGSP).
--
-- Hard constraints baked in here, not optional:
--   * `draft_text` is required at session creation. The service refuses blank
--     submissions with `app-coach.refusal.blank-statement` BEFORE INSERT, so
--     the column is NOT NULL with a CHECK that mirrors the contract floor.
--   * Rewrites land as suggestions (`accepted=false`). The student must
--     explicitly opt-in via POST /app-coach/rewrites/:id/accept to flip it.
--     The coach never auto-applies anything.
--   * Retention: rows expire 90 days after creation. `purge_at` is a defaulted
--     column the eventual purge job will key on; persisting the cutoff at write
--     time (rather than computing from created_at) makes it auditable and
--     lets us extend an individual session manually if a student appeals.
--
-- Web UI is a follow-up (S07+) — backend lands first so the contract stabilises.

CREATE TYPE app_coach_critique_axis AS ENUM (
  'CLARITY',
  'NARRATIVE',
  'EVIDENCE',
  'CONCLUSION'
);

CREATE TABLE app_coach_sessions (
  session_id        BIGSERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  destination_code  study_abroad_destination_code NOT NULL,
  scholarship_id    BIGINT NULL REFERENCES scholarships(scholarship_id) ON DELETE SET NULL,
  draft_text        TEXT NOT NULL,
  draft_word_count  INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purge_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  -- Floor mirrors CreateCoachSessionRequest.draft_text.min(100). The service
  -- enforces the refusal path before INSERT; this CHECK exists so a misuse
  -- via raw SQL still fails loudly.
  CONSTRAINT app_coach_sessions_draft_min_chars CHECK (length(draft_text) >= 100)
);

CREATE INDEX idx_app_coach_sessions_user ON app_coach_sessions (user_id, created_at DESC);
-- Purge job will SELECT WHERE purge_at <= NOW(); indexed for that scan.
CREATE INDEX idx_app_coach_sessions_purge ON app_coach_sessions (purge_at);

CREATE TABLE app_coach_critiques (
  critique_id        BIGSERIAL PRIMARY KEY,
  session_id         BIGINT NOT NULL REFERENCES app_coach_sessions(session_id) ON DELETE CASCADE,
  axis               app_coach_critique_axis NOT NULL,
  feedback_text      TEXT NOT NULL,
  suggested_actions  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_coach_critiques_session ON app_coach_critiques (session_id, created_at);

CREATE TABLE app_coach_rewrites (
  rewrite_id           BIGSERIAL PRIMARY KEY,
  session_id           BIGINT NOT NULL REFERENCES app_coach_sessions(session_id) ON DELETE CASCADE,
  original_paragraph   TEXT NOT NULL,
  suggested_rewrite    TEXT NOT NULL,
  -- accepted=false until the student explicitly POSTs to /accept. Tracks the
  -- product invariant that suggestions are never auto-applied.
  accepted             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Mirrors RewriteParagraphRequest.paragraph_text.min(30) — same logic as
  -- the draft floor above.
  CONSTRAINT app_coach_rewrites_paragraph_min_chars CHECK (length(original_paragraph) >= 30)
);

CREATE INDEX idx_app_coach_rewrites_session ON app_coach_rewrites (session_id, created_at);

CREATE TABLE app_coach_mock_interviews (
  interview_id      BIGSERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  -- Free-text but service-gated to the supported scholarship rotation:
  -- MEXT / Chevening / KGSP. Off-list submissions are refused before INSERT
  -- with `app-coach.refusal.unsupported-interview`.
  scholarship_name  TEXT NOT NULL,
  questions_jsonb   JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_coach_interviews_user ON app_coach_mock_interviews (user_id, created_at DESC);
