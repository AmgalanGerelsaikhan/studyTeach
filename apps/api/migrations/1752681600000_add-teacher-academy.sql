-- 0014 · Teacher Academy — courses, lessons, enrollments, assessments (E-025).
--
-- P1 module (PRD §4.5). Interactive, assessed CPD micro-courses for teachers.
-- This migration lays the catalog + progress + lesson-quiz schema. Final-
-- assessment grading + CPD badges land in E-026; cohort scheduling in E-027.
--
-- Tables:
--   * academy_courses                — global national CPD catalog (not org-scoped, like olympiads).
--   * academy_lessons                — ordered micro-lessons; Cloudflare Stream video_uid.
--   * academy_lesson_assets          — slide decks / PDFs / links per lesson.
--   * academy_enrollments            — one row per (course, teacher); idempotent enroll.
--   * academy_lesson_completions     — one row per (enrollment, lesson).
--   * academy_assessments            — embedded lesson quizzes + one final per course.
--   * academy_assessment_questions   — questions; MC choices + answer key as JSONB.
--   * academy_assessment_submissions — one row per (assessment, enrollment).

-- Up Migration

CREATE TYPE academy_course_status   AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE academy_language_track  AS ENUM ('GENERAL', 'ENGLISH_A1', 'ENGLISH_A2', 'ENGLISH_B1', 'ENGLISH_B2');
CREATE TYPE academy_enrollment_mode AS ENUM ('SELF_PACED', 'COHORT');
CREATE TYPE academy_assessment_kind AS ENUM ('LESSON_QUIZ', 'FINAL');
CREATE TYPE academy_question_kind   AS ENUM ('MULTIPLE_CHOICE', 'SHORT_ANSWER');

CREATE TABLE academy_courses (
  course_id         SERIAL PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  subject           VARCHAR(50)  NOT NULL,
  grade_min         SMALLINT NOT NULL CHECK (grade_min BETWEEN 1 AND 12),
  grade_max         SMALLINT NOT NULL CHECK (grade_max BETWEEN 1 AND 12),
  methodology       VARCHAR(60),
  language_track    academy_language_track NOT NULL DEFAULT 'GENERAL',
  cpd_credits       NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (cpd_credits >= 0),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  summary           TEXT NOT NULL,
  status            academy_course_status NOT NULL DEFAULT 'DRAFT',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT academy_courses_grades_ordered CHECK (grade_min <= grade_max)
);

-- Natural-key UNIQUE so the ingest CLI can ON CONFLICT-upsert.
ALTER TABLE academy_courses
  ADD CONSTRAINT uq_academy_courses_title UNIQUE (title);

CREATE INDEX idx_academy_courses_catalog ON academy_courses (status, subject, language_track);

CREATE TABLE academy_lessons (
  lesson_id              SERIAL PRIMARY KEY,
  course_id              INT NOT NULL REFERENCES academy_courses (course_id) ON DELETE CASCADE,
  ordinal                SMALLINT NOT NULL CHECK (ordinal > 0),
  title                  VARCHAR(255) NOT NULL,
  -- Cloudflare Stream video UID. NULL until content-ops uploads + the manifest
  -- is re-ingested. The player falls back to transcript_mn when NULL or offline.
  video_uid              VARCHAR(64),
  video_duration_seconds INTEGER CHECK (video_duration_seconds IS NULL OR video_duration_seconds > 0),
  transcript_mn          TEXT NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, ordinal)
);

CREATE INDEX idx_academy_lessons_course ON academy_lessons (course_id);

CREATE TABLE academy_lesson_assets (
  asset_id  SERIAL PRIMARY KEY,
  lesson_id INT NOT NULL REFERENCES academy_lessons (lesson_id) ON DELETE CASCADE,
  kind      VARCHAR(20) NOT NULL CHECK (kind IN ('SLIDE', 'PDF', 'LINK')),
  url       TEXT NOT NULL,
  label     VARCHAR(160) NOT NULL,
  ordinal   SMALLINT NOT NULL DEFAULT 1 CHECK (ordinal > 0),
  UNIQUE (lesson_id, ordinal)
);

CREATE TABLE academy_enrollments (
  enrollment_id     SERIAL PRIMARY KEY,
  course_id         INT NOT NULL REFERENCES academy_courses (course_id) ON DELETE RESTRICT,
  teacher_user_id   INT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  -- Snapshotted so the school-admin CPD transcript (E-026) scopes by org.
  organization_code VARCHAR(50),
  mode              academy_enrollment_mode NOT NULL DEFAULT 'SELF_PACED',
  enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotent enroll: a teacher resubmitting returns the existing row.
  UNIQUE (course_id, teacher_user_id)
);

CREATE INDEX idx_academy_enrollments_teacher ON academy_enrollments (teacher_user_id);
CREATE INDEX idx_academy_enrollments_org     ON academy_enrollments (organization_code);

CREATE TABLE academy_lesson_completions (
  completion_id SERIAL PRIMARY KEY,
  enrollment_id INT NOT NULL REFERENCES academy_enrollments (enrollment_id) ON DELETE CASCADE,
  lesson_id     INT NOT NULL REFERENCES academy_lessons (lesson_id) ON DELETE CASCADE,
  watch_seconds INTEGER NOT NULL DEFAULT 0 CHECK (watch_seconds >= 0),
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE academy_assessments (
  assessment_id  SERIAL PRIMARY KEY,
  course_id      INT NOT NULL REFERENCES academy_courses (course_id) ON DELETE CASCADE,
  -- NULL lesson_id = the course's final assessment; set = an embedded lesson quiz.
  lesson_id      INT REFERENCES academy_lessons (lesson_id) ON DELETE CASCADE,
  kind           academy_assessment_kind NOT NULL,
  title          VARCHAR(255) NOT NULL,
  pass_threshold SMALLINT NOT NULL DEFAULT 75 CHECK (pass_threshold BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT academy_assessment_kind_shape CHECK (
    (kind = 'FINAL' AND lesson_id IS NULL) OR
    (kind = 'LESSON_QUIZ' AND lesson_id IS NOT NULL)
  )
);

-- One final per course; one embedded quiz per lesson.
CREATE UNIQUE INDEX uq_academy_assessment_final  ON academy_assessments (course_id) WHERE kind = 'FINAL';
CREATE UNIQUE INDEX uq_academy_assessment_lesson ON academy_assessments (lesson_id) WHERE kind = 'LESSON_QUIZ';

CREATE TABLE academy_assessment_questions (
  question_id   SERIAL PRIMARY KEY,
  assessment_id INT NOT NULL REFERENCES academy_assessments (assessment_id) ON DELETE CASCADE,
  ordinal       SMALLINT NOT NULL CHECK (ordinal > 0),
  prompt        TEXT NOT NULL,
  kind          academy_question_kind NOT NULL,
  -- MULTIPLE_CHOICE: ["choice A", "choice B", ...]. SHORT_ANSWER: [].
  choices       JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- MULTIPLE_CHOICE: [correct choice index]. SHORT_ANSWER: [accepted strings] (E-026 grades).
  answer_key    JSONB NOT NULL DEFAULT '[]'::jsonb,
  points        SMALLINT NOT NULL DEFAULT 1 CHECK (points > 0),
  UNIQUE (assessment_id, ordinal)
);

CREATE TABLE academy_assessment_submissions (
  submission_id SERIAL PRIMARY KEY,
  assessment_id INT NOT NULL REFERENCES academy_assessments (assessment_id) ON DELETE CASCADE,
  enrollment_id INT NOT NULL REFERENCES academy_enrollments (enrollment_id) ON DELETE CASCADE,
  -- { "<question_id>": <choice index | string> }
  answers       JSONB NOT NULL,
  -- score/passed NULL until graded. LESSON_QUIZ auto-grades MC on submit;
  -- FINAL grading + badge issuance is E-026.
  score         SMALLINT CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  passed        BOOLEAN,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotent submit: one attempt per (assessment, enrollment) in E-025.
  UNIQUE (assessment_id, enrollment_id)
);

CREATE INDEX idx_academy_submissions_enrollment ON academy_assessment_submissions (enrollment_id);

COMMENT ON TABLE academy_courses IS
  'Global national Teacher Academy CPD catalog (PRD §4.5). Not org-scoped — like olympiads.';
COMMENT ON COLUMN academy_lessons.video_uid IS
  'Cloudflare Stream video UID. Playback is server-mediated via a signed token (E-025). NULL → transcript-only.';
COMMENT ON COLUMN academy_assessment_submissions.score IS
  'Percent 0-100. LESSON_QUIZ auto-graded on submit; FINAL graded by the E-026 badge service.';

-- Down Migration
-- Intentionally omitted (destructive; enum drops require all consumers gone). ADR-0012.
