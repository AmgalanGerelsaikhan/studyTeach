# Database Schema

> Mirrors PRD §7.3 and is the source of truth. Migrations under `apps/api/migrations/` must keep this document in sync.

## Conventions

- All names `snake_case`. Tables plural; columns singular.
- Every FK gets an index. Time-series columns over 10M rows use BRIN.
- Every user-scoped table either carries `organization_code` directly or FKs to a table that does.
- PII (`phone_number`, `email`, `national_id_hash`) encrypted via `pgcrypto`. National ID stored only as hash.
- Wellbeing data firewalled — see `wellbeing_responses` notes.

## Enums

```sql
CREATE TYPE user_role_enum         AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN');
CREATE TYPE target_audience_enum   AS ENUM ('STUDENT', 'TEACHER', 'OPEN');
CREATE TYPE payment_status_enum    AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'REFUNDED');
CREATE TYPE mastery_level_enum     AS ENUM ('NOT_STARTED', 'INTRODUCED', 'DEVELOPING', 'PROFICIENT', 'MASTERED');
CREATE TYPE risk_flag_enum         AS ENUM ('NONE', 'WATCH', 'ENGAGE');
```

## Core tables

### `users`

```sql
CREATE TABLE users (
    user_id           SERIAL PRIMARY KEY,
    phone_number      VARCHAR(20) UNIQUE NOT NULL,        -- encrypted at rest
    email             VARCHAR(150) UNIQUE,                -- encrypted at rest
    password_hash     VARCHAR(255) NOT NULL,
    primary_role      user_role_enum NOT NULL,
    organization_code VARCHAR(50),
    national_id_hash  VARCHAR(64),                        -- HASHED, never plaintext
    locale            VARCHAR(10) DEFAULT 'mn-Cyrl',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### `schools`

```sql
CREATE TABLE schools (
    school_id        SERIAL PRIMARY KEY,
    school_code      VARCHAR(50) UNIQUE NOT NULL,
    name             VARCHAR(255) NOT NULL,
    aimag            VARCHAR(50)  NOT NULL,
    soum             VARCHAR(100),
    is_urban         BOOLEAN NOT NULL,
    has_boarding     BOOLEAN DEFAULT FALSE,
    is_moza_partner  BOOLEAN NOT NULL DEFAULT FALSE  -- bypasses 20/mo tutor quota
);
```

### `students`

```sql
CREATE TABLE students (
    student_id           SERIAL PRIMARY KEY,
    user_id              INT REFERENCES users(user_id),
    school_id            INT REFERENCES schools(school_id),
    grade                SMALLINT CHECK (grade BETWEEN 1 AND 12),
    is_boarding          BOOLEAN DEFAULT FALSE,
    portable_record_uuid UUID UNIQUE DEFAULT gen_random_uuid()
);
```

### `parent_child_links`

```sql
CREATE TABLE parent_child_links (
    link_id    SERIAL PRIMARY KEY,
    parent_id  INT REFERENCES users(user_id),
    student_id INT REFERENCES students(student_id),
    verified   BOOLEAN DEFAULT FALSE,
    UNIQUE(parent_id, student_id)
);
```

Verification is via national-ID hash + school code; revocation is a single button and propagates within 24 hours.

## Olympiad & registration

### `olympiads`

```sql
CREATE TABLE olympiads (
    olympiad_id         SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    subject             VARCHAR(50)  NOT NULL,
    grade_min           SMALLINT,
    grade_max           SMALLINT,
    target_audience     target_audience_enum NOT NULL,
    registration_opens  TIMESTAMPTZ NOT NULL,
    registration_closes TIMESTAMPTZ NOT NULL,
    exam_date           TIMESTAMPTZ NOT NULL,
    venue               VARCHAR(255),
    is_online           BOOLEAN DEFAULT FALSE,
    base_fee_mnt        INTEGER NOT NULL
);
```

### `registrations`

```sql
CREATE TABLE registrations (
    registration_id   SERIAL PRIMARY KEY,
    student_id        INT REFERENCES students(student_id),
    olympiad_id       INT REFERENCES olympiads(olympiad_id),
    registered_by     INT REFERENCES users(user_id),   -- teacher or student
    signature_hash    VARCHAR(64) NOT NULL,
    payment_status    payment_status_enum DEFAULT 'PENDING',
    qr_payload        TEXT,                             -- signed QR for ticket
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, olympiad_id)
);
```

### `invoices`

```sql
CREATE TABLE invoices (
    invoice_id       SERIAL PRIMARY KEY,
    qpay_invoice_id  VARCHAR(128) UNIQUE,
    school_id        INT REFERENCES schools(school_id),
    issued_to        INT REFERENCES users(user_id),
    total_mnt        INTEGER NOT NULL,
    surcharge_mnt    INTEGER DEFAULT 0,
    signature_hash   VARCHAR(64) UNIQUE NOT NULL,        -- SHA256 idempotency key
    payment_status   payment_status_enum DEFAULT 'PENDING',
    ebarimt_id       VARCHAR(128),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

Idempotency: `signature_hash = SHA256(school_id || student_ids_sorted || olympiad_ids_sorted || registration_window_id)`. Repeated submissions return the existing row.

## Learning & mastery

### `mock_test_results`

```sql
CREATE TABLE mock_test_results (
    result_id   SERIAL PRIMARY KEY,
    student_id  INT REFERENCES students(student_id),
    test_type   VARCHAR(50) NOT NULL,    -- 'EGSH' | 'OLYMPIAD_PRACTICE'
    subject     VARCHAR(50),
    score       INTEGER,
    max_score   INTEGER,
    percentile  NUMERIC(5,2),
    taken_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_results_student ON mock_test_results(student_id, taken_at DESC);
```

### `concept_mastery`

```sql
CREATE TABLE concept_mastery (
    mastery_id        SERIAL PRIMARY KEY,
    student_id        INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    curriculum_strand VARCHAR(100) NOT NULL,
    grade_level       SMALLINT,
    level             mastery_level_enum NOT NULL DEFAULT 'NOT_STARTED',
    p_mastered        NUMERIC(5,4) NOT NULL DEFAULT 0.3000,
    last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, curriculum_strand)
);

CREATE INDEX idx_concept_mastery_student ON concept_mastery(student_id);
```

Updated by the BKT model in the AI Tutor service. `p_mastered` is the continuous BKT posterior; `level` is the bucketed enum projection (<0.2 NOT_STARTED · <0.4 INTRODUCED · <0.6 DEVELOPING · <0.8 PROFICIENT · else MASTERED).

### `ai_tutor_sessions`

```sql
CREATE TABLE ai_tutor_sessions (
    session_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id              INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    lang                    VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
    subject                 VARCHAR(50) NOT NULL,
    grade                   SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at                TIMESTAMPTZ,
    tokens_in               INT NOT NULL DEFAULT 0,
    tokens_out              INT NOT NULL DEFAULT 0,
    in_active_mock_test     BOOLEAN NOT NULL DEFAULT FALSE,
    created_idempotency_key VARCHAR(36) UNIQUE
);

CREATE INDEX idx_ai_tutor_sessions_student_started ON ai_tutor_sessions(student_id, started_at DESC);
```

One row per tutoring session. `created_idempotency_key` is the client UUIDv7 from the offline sync queue; reusing it returns the existing session. `in_active_mock_test` is set by EGSh in S04 — refusal R1 (`ai-tutor.refusal.exam-mode`) reads it.

### `ai_tutor_messages`

```sql
CREATE TABLE ai_tutor_messages (
    message_id   BIGSERIAL PRIMARY KEY,
    session_id   UUID NOT NULL REFERENCES ai_tutor_sessions(session_id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'refusal')),
    content      TEXT NOT NULL,
    citations    JSONB NOT NULL DEFAULT '[]'::jsonb,
    tokens       INT NOT NULL DEFAULT 0,
    refusal_key  VARCHAR(80),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT assistant_turn_has_citation CHECK (
      role <> 'assistant' OR jsonb_array_length(citations) >= 1
    ),
    CONSTRAINT refusal_turn_has_key CHECK (
      role <> 'refusal' OR refusal_key IS NOT NULL
    )
);

CREATE INDEX idx_ai_tutor_messages_session_time ON ai_tutor_messages(session_id, created_at);
```

Tutor transcript. Assistant turns are required to carry ≥1 citation at the DB layer (PRD hard constraint #7). 90-day retention purge scheduled for S05.

### `practice_problems`

```sql
CREATE TABLE practice_problems (
    problem_id  BIGSERIAL PRIMARY KEY,
    strand      VARCHAR(100) NOT NULL,
    grade       SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
    subject     VARCHAR(50) NOT NULL,
    lang        VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
    prompt      TEXT NOT NULL,
    answer_key  TEXT NOT NULL,
    difficulty  SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    source      VARCHAR(50) NOT NULL DEFAULT 'curated',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_practice_problems_strand ON practice_problems(strand, grade, lang);
```

Curated bank fed to the post-tutor practice card pair. S03 ships bank-only; LLM fallback deferred.

## Teacher Academy

### `teacher_certifications`

```sql
CREATE TABLE teacher_certifications (
    cert_id     SERIAL PRIMARY KEY,
    teacher_id  INT REFERENCES users(user_id),
    course_id   INT NOT NULL,
    issued_at   TIMESTAMPTZ DEFAULT NOW(),
    cpd_credits NUMERIC(4,1)
);
```

## Wellbeing & risk (firewalled)

### `wellbeing_responses`

```sql
CREATE TABLE wellbeing_responses (
    response_id    SERIAL PRIMARY KEY,
    student_id     INT REFERENCES students(student_id),
    week_starting  DATE NOT NULL,
    mood_score     SMALLINT CHECK (mood_score   BETWEEN 1 AND 5),
    sleep_score    SMALLINT CHECK (sleep_score  BETWEEN 1 AND 5),
    safety_score   SMALLINT CHECK (safety_score BETWEEN 1 AND 5),
    free_text      TEXT,
    crisis_flagged BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, week_starting)
);
```

**Access policy:** application code reads only the aggregate dashboard view. De-anonymization is via a single audited stored function `escalate_crisis_flag(student_id, week)` callable only by the `crisis_flag_handler` database role. Every call emits an `audit_log` row.

### `risk_flags`

```sql
CREATE TABLE risk_flags (
    flag_id     SERIAL PRIMARY KEY,
    student_id  INT REFERENCES students(student_id),
    flag        risk_flag_enum DEFAULT 'NONE',
    signals     JSONB,
    raised_at   TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

## Audit log (append-only)

```sql
CREATE TABLE audit_log (
    log_id        BIGSERIAL PRIMARY KEY,
    actor_user_id INT REFERENCES users(user_id),
    action        VARCHAR(100) NOT NULL,
    target_type   VARCHAR(50),
    target_id     VARCHAR(100),
    metadata      JSONB,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor_time ON audit_log(actor_user_id, created_at DESC);

-- Enforce append-only
CREATE OR REPLACE FUNCTION raise_on_audit_mutate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit_log is append-only'; END $$;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION raise_on_audit_mutate();
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION raise_on_audit_mutate();
```

Partition monthly. Retention 7 years.

## pgvector — curriculum chunks (AI Tutor RAG)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE curriculum_chunks (
    chunk_id   BIGSERIAL PRIMARY KEY,
    strand     VARCHAR(100) NOT NULL,
    grade      SMALLINT NOT NULL,
    subject    VARCHAR(50) NOT NULL,
    lang       VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
    body       TEXT NOT NULL,
    embedding  vector(1024),
    source_ref TEXT,                       -- citation back to curriculum doc
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cc_strand_grade ON curriculum_chunks(strand, grade, subject, lang);
CREATE INDEX idx_cc_embedding_hnsw
  ON curriculum_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

Embeddings refresh on curriculum publication. `lang` prevents Mongolian/English queries from cross-pollinating. HNSW chosen over ivfflat in migration 0004 — better recall at corpus size, supported by pgvector ≥ 0.5. Shared corpus — **not** tenant-scoped (no `organization_code`).

## Portable Student Record (logical view)

PSR is keyed by `students.portable_record_uuid` and aggregates `mock_test_results`, `registrations`, `teacher_certifications` (if the user is also a teacher), and the **counselor-only** wellbeing flag history. Implemented as a materialized view refreshed nightly; reads emit an audit-log row.

## Indexes (essential set)

```sql
CREATE INDEX idx_registrations_student   ON registrations(student_id);
CREATE INDEX idx_registrations_olympiad  ON registrations(olympiad_id);
CREATE INDEX idx_invoices_school         ON invoices(school_id, created_at DESC);
CREATE INDEX idx_users_org               ON users(organization_code);
CREATE INDEX idx_students_school         ON students(school_id);
```

## Schema review checklist

Before merging a migration:

- [ ] Carries or FKs to `organization_code`.
- [ ] PII columns encrypted or hashed.
- [ ] FK indexes present.
- [ ] No `ON DELETE CASCADE` across organization boundaries.
- [ ] Migration is reversible (or paired with a deprecation migration scheduled one release prior).
- [ ] Lock-time on a 10M-row table <30s; backfill plan attached otherwise.
- [ ] This document updated in the same change.
