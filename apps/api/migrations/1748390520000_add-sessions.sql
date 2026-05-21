-- Migration 0003 · Sessions table for cookie-backed auth
-- Source: PRD §8.1, ADR-0007 (HttpOnly+SameSite=Strict+Secure cookies)
-- Refs: E-003

-- Up Migration
CREATE TABLE sessions (
  session_id    VARCHAR(64) PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  ip            INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_active
  ON sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- Seed users currently have two_factor_enabled = FALSE. Per PRD §8.1
-- (2FA mandatory for Teacher / SchoolAdmin / PlatformAdmin), enable it
-- for those roles so the dev seed reflects the production policy.
UPDATE users SET two_factor_enabled = TRUE
WHERE primary_role IN ('TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN');

-- Down Migration
-- DROP TABLE sessions; -- deliberate: keep history; only the up migration runs.
