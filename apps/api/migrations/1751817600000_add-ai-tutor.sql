-- Migration 0004 · AI Tutor foundation
-- Source of truth: PRD §4.1, §7.3 · docs/DATABASE_SCHEMA.md · docs/modules/ai-tutor.md
-- Sprint: S03 · Refs: E-014 tickets T1, T9, T10, T13 (DDL folded into one file)
--
-- This migration is wider than ticket T1 alone so all tutor DDL lands together:
--   * students                — was documented but not yet migrated; FK target for
--                                ai_tutor_sessions and concept_mastery.
--   * schools.is_moza_partner — flag that exempts a student from the 20/month
--                                quota ceiling (docs/modules/ai-tutor.md §Quotas).
--   * concept_mastery         — BKT writes here from T9. Lands now to keep
--                                tutor schema in one place.
--   * curriculum_chunks       — shared national-curriculum corpus, NOT tenant-
--                                scoped. RAG retrieval reads it. HNSW index per
--                                ADR-0008 amendment (chosen over ivfflat for
--                                better recall at the corpus size we expect).
--   * ai_tutor_sessions       — one row per student tutoring session. Carries the
--                                Idempotency-Key from the offline queue so the
--                                client can retry POST /ai-tutor/sessions safely.
--   * ai_tutor_messages       — turn-by-turn transcript. 90-day retention enforced
--                                by a scheduled job (deferred to S05).
--   * practice_problems       — curated bank for T13. LLM fallback is out of scope
--                                for S03.

-- Up Migration

----------------------------------------------------------------------
-- Prereqs missing from earlier migrations
----------------------------------------------------------------------

CREATE TABLE students (
  student_id           SERIAL PRIMARY KEY,
  user_id              INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  school_id            INT REFERENCES schools (school_id),
  grade                SMALLINT CHECK (grade BETWEEN 1 AND 12),
  is_boarding          BOOLEAN DEFAULT FALSE,
  portable_record_uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_students_school ON students (school_id);
CREATE INDEX idx_students_grade  ON students (grade);

ALTER TABLE schools
  ADD COLUMN is_moza_partner BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN schools.is_moza_partner IS
  'Moza partner schools bypass the 20/month free-tier tutor session ceiling (docs/modules/ai-tutor.md §Quotas).';

----------------------------------------------------------------------
-- Concept mastery (target of BKT — T9)
----------------------------------------------------------------------

CREATE TABLE concept_mastery (
  mastery_id        SERIAL PRIMARY KEY,
  student_id        INT NOT NULL REFERENCES students (student_id) ON DELETE CASCADE,
  curriculum_strand VARCHAR(100) NOT NULL,
  grade_level       SMALLINT,
  level             mastery_level_enum NOT NULL DEFAULT 'NOT_STARTED',
  p_mastered        NUMERIC(5,4) NOT NULL DEFAULT 0.3000,   -- BKT continuous posterior
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, curriculum_strand)
);

CREATE INDEX idx_concept_mastery_student ON concept_mastery (student_id);

COMMENT ON COLUMN concept_mastery.p_mastered IS
  'BKT posterior P(mastered). Bucket thresholds map to mastery_level_enum: <0.2 NOT_STARTED, <0.4 INTRODUCED, <0.6 DEVELOPING, <0.8 PROFICIENT, else MASTERED.';

----------------------------------------------------------------------
-- Curriculum chunks (shared corpus, NOT tenant-scoped)
----------------------------------------------------------------------

CREATE TABLE curriculum_chunks (
  chunk_id   BIGSERIAL PRIMARY KEY,
  strand     VARCHAR(100) NOT NULL,
  grade      SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  subject    VARCHAR(50) NOT NULL,
  lang       VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
  body       TEXT NOT NULL,
  embedding  vector(1024),
  source_ref TEXT NOT NULL,                                 -- e.g. "БНХ 11.4.2" or "ЭЕШ 2024 · Физик · #14"
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cc_strand_grade
  ON curriculum_chunks (strand, grade, subject, lang);

-- HNSW chosen over ivfflat: better recall at our corpus size; supported by
-- pgvector >= 0.5. Cosine distance matches text-embedding-3-large's training.
CREATE INDEX idx_cc_embedding_hnsw
  ON curriculum_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMENT ON TABLE curriculum_chunks IS
  'Shared national curriculum corpus. NOT tenant-scoped — do not add organization_code.';

----------------------------------------------------------------------
-- AI Tutor sessions
----------------------------------------------------------------------

CREATE TABLE ai_tutor_sessions (
  session_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id              INT NOT NULL REFERENCES students (student_id) ON DELETE CASCADE,
  lang                    VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
  subject                 VARCHAR(50) NOT NULL,
  grade                   SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at                TIMESTAMPTZ,
  tokens_in               INT NOT NULL DEFAULT 0,
  tokens_out              INT NOT NULL DEFAULT 0,
  in_active_mock_test     BOOLEAN NOT NULL DEFAULT FALSE,    -- set by EGSh in S04; refusal R1 reads this
  created_idempotency_key VARCHAR(36) UNIQUE                 -- client UUIDv7 from offline queue
);

CREATE INDEX idx_ai_tutor_sessions_student_started
  ON ai_tutor_sessions (student_id, started_at DESC);

COMMENT ON COLUMN ai_tutor_sessions.created_idempotency_key IS
  'Client-supplied UUIDv7 from the offline sync queue (apps/web/lib/offline/queue). Server-side dedup of POST /ai-tutor/sessions.';

----------------------------------------------------------------------
-- AI Tutor messages
----------------------------------------------------------------------

CREATE TABLE ai_tutor_messages (
  message_id   BIGSERIAL PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES ai_tutor_sessions (session_id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'refusal')),
  content      TEXT NOT NULL,
  citations    JSONB NOT NULL DEFAULT '[]'::jsonb,
  tokens       INT NOT NULL DEFAULT 0,
  refusal_key  VARCHAR(80),                                  -- set when role='refusal'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Assistant turns must carry ≥1 citation (PRD hard constraint #7,
  -- sprint exit gate "Every assistant turn has ≥1 citation").
  CONSTRAINT assistant_turn_has_citation CHECK (
    role <> 'assistant' OR jsonb_array_length(citations) >= 1
  ),
  -- Refusal turns must name the canonical refusal key.
  CONSTRAINT refusal_turn_has_key CHECK (
    role <> 'refusal' OR refusal_key IS NOT NULL
  )
);

CREATE INDEX idx_ai_tutor_messages_session_time
  ON ai_tutor_messages (session_id, created_at);

COMMENT ON TABLE ai_tutor_messages IS
  'Tutor transcript. 90-day retention per docs/modules/ai-tutor.md; scheduled purge lands in S05.';

----------------------------------------------------------------------
-- Practice problem bank (T13)
----------------------------------------------------------------------

CREATE TABLE practice_problems (
  problem_id  BIGSERIAL PRIMARY KEY,
  strand      VARCHAR(100) NOT NULL,
  grade       SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  subject     VARCHAR(50) NOT NULL,
  lang        VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
  prompt      TEXT NOT NULL,
  answer_key  TEXT NOT NULL,
  difficulty  SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  source      VARCHAR(50) NOT NULL DEFAULT 'curated',       -- 'curated' | 'llm-validated'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_practice_problems_strand
  ON practice_problems (strand, grade, lang);

COMMENT ON TABLE practice_problems IS
  'Curated practice bank. S03 ships bank-only; LLM-fallback generation deferred.';

-- Down Migration
-- Intentionally omitted (destructive). Per ADR-0012 we keep history; revert in
-- dev by dropping the database and re-running `pnpm db:migrate`.
