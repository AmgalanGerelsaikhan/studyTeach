-- Migration: Parent Portal web (PRD §4.8, P1 subset — USSD deferred).
--
-- Links a PARENT user to one or more STUDENT users by national-ID hash +
-- school-code verification. Outbound SMS uses existing infra (P0 §4.8 SMS).
-- Per CLAUDE.md constraint #4: every read of a linked child's summary writes
-- an audit_log row scoped by organization_code.
--
-- Revocation: clears verified status and records the revocation in a separate
-- table so the audit trail is intact. Re-link requires a fresh OTP.

CREATE TYPE parent_link_status AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

CREATE TABLE parent_child_links (
  link_id           BIGSERIAL PRIMARY KEY,
  parent_user_id    INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  student_id        INTEGER     NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  -- Locks the link to a specific child by national-ID hash. The hash must
  -- match students.national_id_hash for the requested school_code.
  national_id_hash  TEXT        NOT NULL,
  school_code       TEXT        NOT NULL,
  status            parent_link_status NOT NULL DEFAULT 'PENDING',
  -- OTP challenge token while status = PENDING; cleared on VERIFIED.
  otp_challenge     TEXT        NULL,
  otp_expires_at    TIMESTAMPTZ NULL,
  verified_at       TIMESTAMPTZ NULL,
  revoked_at        TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One verified link per (parent, student) at a time; revoked rows keep the
  -- audit trail but a re-link creates a fresh PENDING row.
  UNIQUE (parent_user_id, student_id, status)
);

CREATE INDEX idx_parent_child_links_parent ON parent_child_links (parent_user_id, status);
CREATE INDEX idx_parent_child_links_student ON parent_child_links (student_id, status);

-- Separate revocation log so we can answer "when did X revoke access" without
-- losing the parent_child_links row history. PARENT can revoke an entire
-- school's read access (cascades to every link at that school for them).
CREATE TABLE parent_revocations (
  revocation_id  BIGSERIAL PRIMARY KEY,
  parent_user_id INTEGER     NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  school_code    TEXT        NOT NULL,
  reason         TEXT        NULL,
  revoked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parent_revocations_parent ON parent_revocations (parent_user_id, revoked_at DESC);
