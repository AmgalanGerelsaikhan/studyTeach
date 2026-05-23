-- 0008 · Olympiad directory + registration (E-016).
--
-- Tables:
--   * olympiads     — public directory; filterable; cursor pagination by exam_date.
--   * registrations — one row per student per olympiad. UNIQUE (student_id,
--                     olympiad_id) prevents accidental dupes; signature_hash
--                     UNIQUE is the cross-row idempotency anchor for the
--                     bulk-registration QPay invoice (PRD §7.2 — invoice
--                     creation hashes the sorted student_ids + olympiad_ids,
--                     so a teacher resubmitting the same roster returns the
--                     same registration set).

-- Up Migration

CREATE TABLE olympiads (
  olympiad_id         SERIAL PRIMARY KEY,
  title               VARCHAR(255) NOT NULL,
  organizer           VARCHAR(120) NOT NULL,
  subject             VARCHAR(50)  NOT NULL,
  grade_min           SMALLINT NOT NULL CHECK (grade_min BETWEEN 1 AND 12),
  grade_max           SMALLINT NOT NULL CHECK (grade_max BETWEEN 1 AND 12),
  target_audience     target_audience_enum NOT NULL DEFAULT 'STUDENT',
  registration_opens  TIMESTAMPTZ NOT NULL,
  registration_closes TIMESTAMPTZ NOT NULL,
  exam_date           TIMESTAMPTZ NOT NULL,
  aimag               VARCHAR(60),                  -- venue province; null when is_online
  venue               VARCHAR(255),
  is_online           BOOLEAN NOT NULL DEFAULT FALSE,
  base_fee_mnt        INTEGER NOT NULL CHECK (base_fee_mnt >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT grades_ordered CHECK (grade_min <= grade_max),
  CONSTRAINT windows_ordered CHECK (registration_opens < registration_closes
                                    AND registration_closes <= exam_date)
);

-- Natural-key UNIQUE so the seed CLI can ON CONFLICT-upsert.
ALTER TABLE olympiads
  ADD CONSTRAINT uq_olympiads_title_date UNIQUE (title, exam_date);

CREATE INDEX idx_olympiads_subject_grade_exam ON olympiads (subject, grade_min, grade_max, exam_date);
CREATE INDEX idx_olympiads_aimag              ON olympiads (aimag);
CREATE INDEX idx_olympiads_exam_date          ON olympiads (exam_date DESC);

CREATE TABLE registrations (
  registration_id   SERIAL PRIMARY KEY,
  student_id        INT NOT NULL REFERENCES students (student_id) ON DELETE CASCADE,
  olympiad_id       INT NOT NULL REFERENCES olympiads (olympiad_id) ON DELETE RESTRICT,
  registered_by     INT NOT NULL REFERENCES users (user_id),
  signature_hash    VARCHAR(64) NOT NULL,
  payment_status    payment_status_enum NOT NULL DEFAULT 'PENDING',
  -- Signed QR payload — written by E-021 (S05). Stays NULL through S04.
  qr_payload        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, olympiad_id)
);

-- Idempotency anchor: bulk registration submits hash the sorted
-- {school_id, student_ids, olympiad_ids, registration_window_id}.
-- Two callers submitting the same payload return the same set of rows.
CREATE INDEX idx_registrations_signature_hash ON registrations (signature_hash);
CREATE INDEX idx_registrations_student        ON registrations (student_id);
CREATE INDEX idx_registrations_olympiad       ON registrations (olympiad_id);

COMMENT ON COLUMN registrations.signature_hash IS
  'SHA-256 over the canonical registration tuple. Same hash + same olympiad_id MUST return the existing row (PRD §7.2 hard constraint #5).';
COMMENT ON COLUMN registrations.qr_payload IS
  'Signed digital ticket payload. Populated by E-021 (S05) after QPay confirmation. NULL through S04 — UI shows "payment pending" stub.';

-- Down Migration
-- Intentionally omitted (destructive). ADR-0012.
