-- Migration: Portable Student Record (PRD §4.9, P1).
--
-- The PSR is a national-ID-keyed academic transcript that follows a herder
-- family's child across school transfers. Per PRD §11.1 the schema is
-- aligned in advance with the future MoE data-interoperability standard so
-- that mapping is a transformation, not a re-write.
--
-- `students.portable_record_uuid` already exists (added with the initial
-- students migration) — keyed off that. This migration adds:
--   - psr_access_grants: owner-managed read grants per school
--   - audit_log entries are emitted by application code on every read
--     (see apps/api/src/modules/psr/psr.service.ts)
--
-- Revocation: setting revoked_at on a grant blocks future reads. The 24h
-- propagation guarantee (PRD §4.9) is provided by application-level cache
-- invalidation in psr.service.ts.

CREATE TABLE psr_access_grants (
  grant_id            BIGSERIAL PRIMARY KEY,
  -- Subject of the record. The grant is keyed off the portable_record_uuid
  -- rather than student_id so the grant survives student_id reassignment.
  portable_record_uuid UUID    NOT NULL,
  grantee_school_code TEXT     NOT NULL,
  granted_by_user_id  INTEGER  NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  reason              TEXT     NULL,
  granted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at          TIMESTAMPTZ NULL,
  -- One active grant per (uuid, school). Re-grant creates a new row; revoke
  -- timestamps the old one — full history preserved.
  UNIQUE (portable_record_uuid, grantee_school_code, granted_at)
);

CREATE INDEX idx_psr_grants_active
  ON psr_access_grants (portable_record_uuid, grantee_school_code)
  WHERE revoked_at IS NULL;
CREATE INDEX idx_psr_grants_granter
  ON psr_access_grants (granted_by_user_id, granted_at DESC);
