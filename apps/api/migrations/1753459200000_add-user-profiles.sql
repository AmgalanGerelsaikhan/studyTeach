-- Migration · user_profiles table for n8n-style signup wizard
--
-- Per docs/signup-wizard-schema.json (decisions locked 2026-05-24):
--   - Profile fields live outside `users` so the auth table stays minimal.
--   - All role-specific columns are NULLable (only the relevant role fills them).
--   - One row per user (1:1 with users.user_id, ON DELETE CASCADE).
--   - PLATFORM_ADMIN cannot self-sign-up — no row for them.

CREATE TABLE user_profiles (
  user_id            INT          PRIMARY KEY REFERENCES users (user_id) ON DELETE CASCADE,
  full_name          VARCHAR(80)  NOT NULL,
  -- STUDENT: grade (G6..G12). Closed enum lives in app code, not DB, so the
  -- wizard schema is the source of truth and adding K-12 grades later is a
  -- single-file change.
  grade              VARCHAR(10),
  -- TEACHER: subject key (math, physics, …) and experience bracket.
  subject            VARCHAR(40),
  experience_years   VARCHAR(10),
  -- SCHOOL_ADMIN: position (principal, deputy, it_admin, other).
  position           VARCHAR(40),
  -- PARENT: which school they declared interest in. Audit scope still requires
  -- the existing /parent/link SMS OTP flow — this column is metadata, not
  -- a grant.
  child_school_code  VARCHAR(50),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_child_school ON user_profiles (child_school_code);

COMMENT ON COLUMN user_profiles.child_school_code IS
  'PARENT-only metadata. Does not grant audit scope — use /parent/link SMS OTP.';

-- Down: drop the table. Safe because no FKs point at it.
