-- Migration 0001 · Initial enums + users + schools
-- Source of truth: PRD §7.3, docs/DATABASE_SCHEMA.md
-- Refs: E-002, ADR-0003 (pgvector + pgcrypto), ADR-0006 (multi-tenant scoping),
--       ADR-0012 (node-pg-migrate plain SQL)

-- Up Migration
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE user_role_enum AS ENUM (
  'STUDENT',
  'TEACHER',
  'PARENT',
  'SCHOOL_ADMIN',
  'PLATFORM_ADMIN'
);

CREATE TYPE target_audience_enum AS ENUM ('STUDENT', 'TEACHER', 'OPEN');

CREATE TYPE payment_status_enum AS ENUM (
  'PENDING',
  'PAID',
  'EXPIRED',
  'REFUNDED'
);

CREATE TYPE mastery_level_enum AS ENUM (
  'NOT_STARTED',
  'INTRODUCED',
  'DEVELOPING',
  'PROFICIENT',
  'MASTERED'
);

CREATE TYPE risk_flag_enum AS ENUM ('NONE', 'WATCH', 'ENGAGE');

CREATE TABLE schools (
  school_id     SERIAL PRIMARY KEY,
  school_code   VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  aimag         VARCHAR(50)  NOT NULL,
  soum          VARCHAR(100),
  is_urban      BOOLEAN      NOT NULL,
  has_boarding  BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE users (
  user_id            SERIAL PRIMARY KEY,
  phone_number       VARCHAR(20) UNIQUE NOT NULL,
  email              VARCHAR(150) UNIQUE,
  password_hash      VARCHAR(255) NOT NULL,
  primary_role       user_role_enum NOT NULL,
  organization_code  VARCHAR(50),
  national_id_hash   VARCHAR(64),
  locale             VARCHAR(10) NOT NULL DEFAULT 'mn-Cyrl',
  totp_secret        VARCHAR(64),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users (organization_code);
CREATE INDEX idx_users_role ON users (primary_role);

-- Phone + email + national_id_hash are encrypted at the application layer
-- using pgcrypto helpers (apps/api/src/lib/crypto/).
COMMENT ON COLUMN users.phone_number IS 'Encrypted at rest via pgcrypto application helper';
COMMENT ON COLUMN users.email IS 'Encrypted at rest via pgcrypto application helper';
COMMENT ON COLUMN users.national_id_hash IS 'SHA-256 hash; never plaintext';

-- Down Migration
-- (executed via `pnpm db:migrate:revert`; deliberately omitted because
--  enum drops require all consumers gone first — see ADR-0012)
