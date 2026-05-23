-- Migration: Study Abroad Hub v2 (PRD §4.10, P1 portions only).
--
-- Covers §4.10a Destination Blueprints (8 destinations × 5 blueprint sections)
-- and §4.10b Scholarship Aggregator. §4.10c AI Application Coach and §4.10d
-- Mongolian Alumni Network are P2 and explicitly out of scope.
--
-- Mongolian Cyrillic only per hard constraint #1 — the spec mentions bilingual
-- (mn + en) but constraint #1 narrowed locale to mn-Cyrl in S06.

CREATE TYPE study_abroad_destination_code AS ENUM (
  'US', 'JP', 'KR', 'CN', 'RU', 'DE', 'UK', 'AU'
);

CREATE TYPE study_abroad_blueprint_section AS ENUM (
  'CORE_CONCEPT',
  'CORE_REQUIREMENTS',
  'FINANCIAL_PATHWAY',
  'APPLICATION_TIMELINE',
  'COMMON_PITFALLS'
);

CREATE TYPE scholarship_level AS ENUM ('UG', 'PG', 'PHD');
CREATE TYPE scholarship_funding_type AS ENUM ('FULL', 'PARTIAL', 'TUITION_ONLY');

CREATE TABLE destinations (
  destination_code    study_abroad_destination_code PRIMARY KEY,
  name_mn             TEXT NOT NULL,
  primary_pathway_mn  TEXT NOT NULL,
  hero_image_url      TEXT NULL,
  ordinal             INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_destinations_ordinal ON destinations (ordinal);

CREATE TABLE destination_blueprints (
  blueprint_id     BIGSERIAL PRIMARY KEY,
  destination_code study_abroad_destination_code NOT NULL
    REFERENCES destinations(destination_code) ON DELETE CASCADE,
  section          study_abroad_blueprint_section NOT NULL,
  body_mn          TEXT NOT NULL,
  ordinal          INTEGER NOT NULL,
  UNIQUE (destination_code, section)
);

CREATE TABLE scholarships (
  scholarship_id      BIGSERIAL PRIMARY KEY,
  name_mn             TEXT NOT NULL,
  funder              TEXT NOT NULL,
  destination_code    study_abroad_destination_code NOT NULL
    REFERENCES destinations(destination_code) ON DELETE RESTRICT,
  level               scholarship_level NOT NULL,
  eligibility_mn      TEXT NOT NULL,
  deadline            DATE NOT NULL,
  application_url     TEXT NOT NULL,
  document_checklist  JSONB NOT NULL DEFAULT '[]'::jsonb,
  funding_type        scholarship_funding_type NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Natural key prevents duplicate scholarship rows across re-ingests.
  UNIQUE (name_mn, funder, deadline)
);

CREATE INDEX idx_scholarships_destination ON scholarships (destination_code, deadline);
CREATE INDEX idx_scholarships_level ON scholarships (level, deadline);
-- Plain index over deadline — partial WHERE deadline >= CURRENT_DATE is not
-- IMMUTABLE so PG won't accept it as a predicate. Filter at query time.
CREATE INDEX idx_scholarships_deadline ON scholarships (deadline);

CREATE TABLE scholarship_watches (
  watch_id        BIGSERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  scholarship_id  BIGINT  NOT NULL REFERENCES scholarships(scholarship_id) ON DELETE CASCADE,
  notify_at       TIMESTAMPTZ NULL,
  notified_at     TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scholarship_id)
);

CREATE INDEX idx_scholarship_watches_user ON scholarship_watches (user_id);
CREATE INDEX idx_scholarship_watches_pending
  ON scholarship_watches (notify_at)
  WHERE notified_at IS NULL;
