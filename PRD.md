# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Unified Educational Portal — Mongolia

| Field | Value |
|---|---|
| **Document Version** | 2.0.0 |
| **Supersedes** | v1.2.0 (May 20, 2026) |
| **Date** | May 20, 2026 |
| **Target Launch** | Phased — P0 modules Q3 2026, P1 modules Q1 2027, P2 modules Q3 2027 |
| **Status** | Draft for architecture and stakeholder review |
| **Companion Document** | `CURRENT_ISSUES_AND_SOLUTIONS.md` |

---

## 1. Executive Summary & System Objectives

The Unified Educational Portal is a national-scale platform for Mongolian K-12 students, teachers, and parents. v2.0.0 reframes the platform from "Olympiad registration + study abroad guides" to a **four-asymmetry equity engine**: closing the access gap, the quality gap, the information gap, and the tooling gap between Ulaanbaatar and the rest of the country.

The platform delivers:

1. **Learning** — adaptive AI Tutor and EGSh (ЭЕШ) prep engine, free at point of use for public school students.
2. **Competition** — fragmented Olympiad ecosystem unified into one directory, registration, and practice engine with QPay + E-Barimt automation.
3. **Profession** — Teacher Academy with micro-courses, peer cohorts, and certification badges.
4. **Pathway** — Study Abroad Hub covering eight destinations + scholarship aggregator + AI Application Coach + Mongolian alumni mentor network.
5. **Visibility** — Parent Portal with SMS fallback, Portable Student Record for migrant families, Wellbeing Pulse for boarding students.

The platform is designed to operate on 3G connectivity, in unstable-power environments, and with full offline functionality for rural schools.

---

## 2. Goals & Non-Goals

### 2.1 Goals (v2.0.0)

- Reach 150,000+ active monthly users in the first 12 months, with ≥30% from outside Ulaanbaatar.
- Narrow the median mock-EGSh score gap between UB and provincial students by 15 points within 12 months of P1 launch.
- Process zero deadline-night database outages during national Olympiad registration windows.
- Issue 5,000+ Teacher Academy certificates in year one.
- Function fully offline for ≥7 days for any user in a rural soum with intermittent power.

### 2.2 Non-Goals

- **Not a school management system (SIS).** No timetabling, no payroll, no asset management. The platform integrates with school SIS where one exists; it does not replace it.
- **Not a LMS replacement.** Bagsh.ai and other LMS products coexist; the portal links out rather than rebuilding.
- **Not a social network.** No public profiles, no follower graphs, no feed. Mentorship is structured and request-based.
- **Not a content marketplace.** No third-party publisher onboarding in v2.0.0.

---

## 3. User Roles & Access Control (RBAC)

Five roles in v2.0.0. Authorization enforced at middleware layer via signed session tokens.

| Role | Operational Scope | Permitted Modules |
|---|---|---|
| **Student** | Learners grades 1-12 seeking learning, Olympiad, and study-abroad pathways. | AI Tutor, EGSh Prep, Olympiad Directory, Practice Engine, QPay Personal Checkout, Study Abroad Hub, Digital Ticket Locker, Wellbeing Pulse (if boarding). |
| **Teacher** | Dual-profile: institutional coordinator + individual competitor + CPD learner. | Bulk Roster Upload, Teacher Resource CMS, Student Analytics, Teacher Olympiad Track, Teacher Academy, Focus Mode, Unified QPay Checkout, Personal Ticket Locker. |
| **Parent / Guardian** | Visibility into one or more children's records, performance, and wellbeing. | Parent Portal (read), Boarding Welfare View (read), Payment History, SMS Subscription. |
| **School Admin** | Principal or designated administrator of one institution. | School-level analytics, roster management, dormitory roster, CPD tracking for school's teachers, Boys-at-Risk dashboard. |
| **System Admin (Platform)** | Moza operational staff. | Competition Constructor, Financial Reconciliation Ledger, Mass Communication Engine, Resource Content Manager, AI Tutor monitoring, audit log access. |

Multi-tenant isolation: every database query is scoped by `organization_code` at the middleware layer. Cross-tenant reads are explicitly forbidden except for platform-level admins and require an audit log entry.

---

## 4. Functional Requirements by Module

### 4.1 AI Tutor (Mongolian-language)

**Purpose:** give every student a free, adaptive tutor that explains concepts in clear Mongolian, generates practice problems, and tracks mastery.

**Requirements:**

- Subject coverage at launch: Mathematics (grades 1-12), Mongolian Language, Physics, Chemistry, Biology, History, English.
- Conversational interface in Mongolian (Cyrillic primary; Latin transliteration toggle for users on devices without Cyrillic keyboards).
- Retrieval grounded in the national curriculum: every response cites the curriculum strand and grade level being addressed.
- Adaptive difficulty: tracks per-concept mastery using a Bayesian Knowledge Tracing model; surfaces remediation when mastery drops below threshold.
- Practice problem generator produces 5-10 problems per session; problems are pulled from a curated bank first, generated via LLM as fallback with human-validated answer keys.
- Free tier: 20 sessions per student per month for any student with a verified school code; unlimited for students at partner schools.
- Safety: refuses non-academic requests, refuses to write essays for students, refuses to give exam answers during an active mock test session.

### 4.2 EGSh (ЭЕШ) Prep Engine

**Purpose:** the most important module for upper secondary students. Free, high-quality, score-band-predictive EGSh preparation.

**Requirements:**

- Past papers: full archive of EGSh papers from 2013 onward, in original Mongolian, with worked solutions.
- Subject scope: Mongolian Language (mandatory), Mathematics, Physics, Chemistry, Biology, English, Russian, History, Social Studies, Geography.
- Timed mock tests: full-length, proctored-mode option (camera + tab-lock for self-discipline), instant score on submission.
- Adaptive remediation: missed questions feed into AI Tutor; tutor opens that concept's remediation track.
- Score-band predictor: shows the user a confidence interval for their likely EGSh score based on mock performance; resets weekly.
- Cohort comparison (anonymous): student sees their percentile against peers in same grade, same aimag, and nationally — never absolute names.
- Free for all students at registered public schools; tiered access for unregistered users.

### 4.3 Olympiad Directory & Digital Ticket Module

**Carried over from v1.2.0, with extensions.**

**Requirements:**

- Filterable directory: subject (Math, Physics, Chemistry, Biology, Informatics, Mongolian Language, English, History), grade bracket, organizer, registration window, venue, fee.
- **NEW: Regional / Online Olympiad delivery** — Olympiad organizers can publish online-proctored variants, removing travel cost as a barrier for soum students.
- Practice Engine: historical exam PDFs, timed mock tests with instant score.
- Digital Ticket Locker: cryptographically signed QR-code admission ticket auto-generated on QPay payment confirmation. Ticket contains: student name, registration hash, venue, seat allocation, exam time, signed QR.
- Offline ticket display: ticket image is cached in PWA and renders even when the device is offline at the venue.

### 4.4 Teacher Administrative & Resource Workspace

**Carried over from v1.2.0, with extensions.**

**Requirements:**

- **Dual-mode dashboard toggle**: Administration Mode ("My Students") vs. Competitor Mode ("My Competitions"). Prevents cognitive overload.
- Bulk Roster Upload: drag-and-drop CSV or Excel parser. Schema: `[Student Name, National Registration ID, Grade, Selected Olympiad Tracks]`. Validates national ID checksum, deduplicates within school, returns row-level errors.
- Student Analytics Matrix: per-student and per-class views of mock test results; identifies weak conceptual areas before exam dates.
- Teacher Olympiad Hub: separate competition track for in-service teachers (pedagogy tournaments, subject-master challenges, curriculum-design competitions).
- Personal Registration Tracker: teacher's personal Olympiad tickets, isolated from school delegation rosters.

### 4.5 Teacher Academy (NEW)

**Purpose:** address the rural teacher quality gap directly. Replace "static PDF teaching guides" with interactive, assessed micro-courses.

**Requirements:**

- Course catalog organized by: subject, grade level, methodology (active learning, formative assessment, differentiated instruction), and language proficiency (English for teachers).
- Each course: 6-12 micro-lessons of 15-25 minutes each, with embedded quizzes, a final assessment, and a peer-discussion thread.
- Certification: course completion + ≥75% on assessment issues a digital badge. Badges include an MoE-aligned CPD credit value (subject to MoE partnership; see Section 11.1).
- Cohort mode: teachers can enroll in a synchronous cohort with weekly live sessions; otherwise self-paced.
- English for Teachers track: structured 6-month pathway from A1 to B2 oriented around classroom English needs.
- Profile: each teacher has a public-within-platform CPD transcript visible to their school admin.

### 4.6 Focus Mode (NEW)

**Purpose:** address the 33% of Mongolian students distracted by digital devices in class.

**Requirements:**

- Teacher-initiated session: teacher generates a one-time class code; students join via the app.
- During an active session, student accounts are restricted to the assigned activity (e.g., a quiz, a tutor session on a specific topic, a reading).
- Non-academic app features are suppressed for the session duration.
- Session ends automatically at the scheduled time or when the teacher closes it.
- Optional: teacher receives an anonymous summary of class engagement after the session.

### 4.7 Wellbeing & Risk Modules (NEW)

#### 4.7a Wellbeing Pulse (boarding students)

- Weekly anonymous 5-question check-in for students in boarding dormitories.
- Aggregate dashboard for school counselor showing dormitory-level trends; never individual identifiers.
- Hard-flag protocol: if a student's free-text response contains crisis-indicator phrases (validated Mongolian-language list), the response is routed immediately and de-anonymized to a designated school counselor with an audit trail. This is the only de-anonymization path and is disclosed to students at consent time.

#### 4.7b Boys-at-Risk Early Warning

- Inputs: attendance pattern, mock test performance trajectory, Olympiad engagement, parent-reported absences.
- Output: school admin sees a list of male students whose signals match high-dropout-risk patterns from historical data.
- Framed as opportunity flagging: the dashboard surfaces "students who would benefit from intervention" rather than "students at risk of failure." Language matters.
- Visibility: school admin and designated teachers only. Never the student, never other students.

#### 4.7c Boarding Bus Tracker (Optional)

- Optional integration with shuttle operators for participating schools.
- GPS-based check-in: student scans QR on boarding the shuttle; parent receives SMS notification.
- Marked P3 — ship only if a hardware partner is secured.

### 4.8 Parent Portal + SMS Gateway (NEW)

**Purpose:** reach the 5% of herder families with no device and the larger group whose only device is a feature phone.

**Requirements:**

- Parent account linked to one or more children via national ID + school code verification.
- Multi-language UI: Mongolian Cyrillic (default), Mongolian Latin transliteration, English.
- Views: child's upcoming Olympiads, mock test trajectory, registration status, payment history, dormitory welfare (if boarding), Teacher Academy progress (if parent is also a teacher).
- **SMS fallback** for parents on feature phones:
  - Registration status notifications (paid / pending / failed).
  - Mock test completion notifications with one-line summary.
  - Olympiad reminder 24h before exam.
  - Inbound: parent can text a short code (e.g., `STATUS` or `СОНГОН`) to query child's most recent activity.
- USSD menu for parents on the most basic phones (negotiated with Mobicom/Unitel/G-Mobile).

### 4.9 Portable Student Record (PSR) (NEW)

**Purpose:** when a herder family migrates and a child changes schools, the academic record should follow.

**Requirements:**

- National-ID-keyed transcript stored centrally, encrypted at rest.
- Contains: grades, mock test history, Olympiad participation, Teacher Academy CPD (if the user is also a teacher), wellbeing flags (counselor-access only).
- Schema designed to comply with the future MoE national education data interoperability standard (parallel track; see Section 11.1).
- Privacy: student (if ≥16) or parent (if <16) can revoke any school's read access at any time.
- Audit log: every read of a PSR is logged with reader ID, timestamp, and reason.

### 4.10 Study Abroad Hub v2 (EXPANDED)

**Purpose:** demystify global applications for students with no prior knowledge. v1.2.0 covered only USA and Japan; v2.0.0 covers eight destinations plus a scholarship aggregator, AI Application Coach, and alumni network.

**Destinations covered in v2.0.0:**

| Destination | Primary Pathway Documented | Why It Matters for Mongolians |
|---|---|---|
| **United States** | Holistic admissions (transcripts, TOEFL/IELTS/Duolingo, extracurriculars, personal statement, recommendations); need-based aid | Top-tier financial aid availability |
| **Japan** | MEXT Scholarship (Embassy recommendation); EJU route via Japanese language preparatory institute | Largest MEXT cohort destination |
| **South Korea** | KGSP (Korean Government Scholarship Program); GKS; direct admission with TOPIK | Largest year-on-year growth destination |
| **China** | Chinese Government Scholarship (CSC); HSK-based admission; Belt-and-Road program slots | Large scholarship volume |
| **Russia** | Russian Government Quota; entrance exams; Mongolia-Russia bilateral slots | Historical and ongoing high enrollment |
| **Germany** | Tuition-free public universities; TestAS; DSH/TestDaF for German-taught programs; English-taught Master's | Tuition-free pathway critical for cost-sensitive families |
| **United Kingdom** | UCAS application; Chevening Scholarship; foundation-year pathways | Top-ranked institutions |
| **Australia** | Direct undergraduate admission; Australia Awards Scholarship; pathway colleges | Large Mongolian diaspora support |

**Sub-modules:**

#### 4.10a Destination Blueprints

- Each destination has a structured blueprint: Core Concept → Core Requirements → Financial Pathway → Application Timeline → Common Pitfalls.
- Tab-based UI to prevent content fatigue.
- All content available in both Mongolian and English.

#### 4.10b Scholarship Aggregator

- Database of scholarships open to Mongolian nationals, with: name, funder, level (UG/PG/PhD), destination, eligibility, deadline, application URL, document checklist.
- Filterable by: destination, field of study, level, deadline window, funding type (full / partial / tuition-only).
- Deadline notifications via in-app + email + optional SMS.

#### 4.10c AI Application Coach

- Personal statement drafting and critique:
  - Coach reads the student's draft and returns structured feedback (clarity, narrative arc, evidence, conclusion).
  - Coach can rewrite individual paragraphs on request, marked as suggestions (never auto-replacing student's text).
  - Refuses to write the personal statement from scratch on a blank input; requires the student to provide a draft or a structured outline first.
- Recommendation letter checklist for teachers.
- Mock interview generator for scholarships with interview rounds (MEXT, Chevening, KGSP).
- All outputs available in Mongolian and English.

#### 4.10d Mongolian Alumni Network

- Verified Mongolian alumni studying or graduated from any of the eight destinations can opt in as mentors.
- Verification: alumni provide acceptance letter or student ID, validated by Moza staff.
- Mentorship is request-based and bounded: one introduction request per applicant per mentor, with a structured form (what is the question, what have you already researched).
- No DMs, no follower graphs. Anti-harassment by design.

---

## 5. Mongolian Ecosystem Localization & Bottleneck Solutions

### 5.1 Low-Bandwidth & Rural Connectivity Optimization

**Carried from v1.2.0, extended.**

- Progressive Web App with full IndexedDB caching of form states, content, and ticket assets.
- Service Worker pre-fetches: AI Tutor curriculum content, past EGSh papers, current Olympiad directory, user's upcoming tickets.
- Sync queue: any action taken offline is queued and replays on reconnection with idempotency keys.
- **NEW: Full offline content packs** — schools can download a 500MB-1GB content pack monthly via USB or local Wi-Fi from the school's central computer; students sync from school Wi-Fi.
- **NEW: SMS / USSD fallback** for users with no smartphone.

### 5.2 High-Stress Registration Deadline Surges

**Carried from v1.2.0.**

- Async backend message broker (Redis Streams) captures and sequences QPay invoice generation and registration writes.
- Frontend shows queue position and ETA when surge mode is active.
- Database write path is single-writer-per-shard during surge windows; reads remain unconstrained.

### 5.3 Automated Fiscal Compliance (E-Barimt Sync)

**Carried from v1.2.0.**

- QPay confirmation webhook binds to ebarimt.mn API to auto-generate E-Barimt receipts.
- Receipts attach to the user's payment history and are downloadable as PDF.
- Bulk-payment reconciliation report exportable by school admin for school accounting workflows.

### 5.4 Power-Loss Resilience (NEW)

- All write operations are journaled before acknowledgement.
- Client-side IndexedDB persists pending writes across browser crashes and forced reboots.
- Sync resumes automatically on next session.

---

## 6. AI Layer (NEW — Cross-Cutting)

The AI layer powers the AI Tutor, EGSh Prep adaptive remediation, AI Application Coach, and Wellbeing Pulse crisis-phrase detection.

### 6.1 Model Strategy

- **Primary:** Mongolian-finetuned LLM (vendor selection pending evaluation across Claude, GPT-4-class, and local-language candidates).
- **Retrieval layer:** vector index over the national curriculum (grades 1-12, all subjects), past EGSh papers, and destination blueprints.
- **Refusal layer:** classifier-based guardrails that block (a) requests for exam answers during active mock tests, (b) requests to write personal statements from scratch, (c) non-academic chitchat at scale.
- **Human-in-the-loop:** all AI-generated practice problems are reviewed by a subject teacher before entering the public bank during the first 6 months post-launch.

### 6.2 Cost Controls

- Per-user monthly token budget on the free tier (20 sessions, ~50K tokens per session).
- Caching of common queries by curriculum strand reduces marginal cost ~60%.
- Heavier models reserved for AI Application Coach (lower volume, higher value); lighter models serve AI Tutor practice problems.

### 6.3 Localization

- Primary language: Mongolian Cyrillic.
- Secondary: Mongolian Latin transliteration (for keyboard-constrained devices), English (for Study Abroad Hub and Teacher Academy English track).
- Glossary of curriculum-specific Mongolian terminology maintained by Moza pedagogy team.

---

## 7. Technical Architecture

### 7.1 High-Level Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind | Same stack carried from v1.2.0 |
| Mobile | PWA only at launch; native wrapper (Capacitor) in Phase 2 | Lower maintenance, faster ship |
| Backend | NestJS, TypeScript | Carried from v1.2.0 |
| Primary DB | PostgreSQL 16 | Carried from v1.2.0 |
| Cache / Queue | Redis 7 (Streams + standard cache) | Carried from v1.2.0 |
| Vector store | pgvector extension on PostgreSQL | Avoid adding a separate vector DB |
| Object storage | S3-compatible (Cloudflare R2 or AWS S3) | PDFs, content packs, recorded sessions |
| SMS gateway | Mobicom / Unitel / G-Mobile via aggregator | Domestic coverage |
| Payments | QPay | Carried from v1.2.0 |
| E-Receipts | ebarimt.mn API | Carried from v1.2.0 |
| Hosting | Railway (Singapore region) for API; CDN for static assets | Low latency to UB |

### 7.2 Financial Transaction Calculation Model

When an invoice is compiled, the backend aggregates item rows based on candidate groups:

```
Total_Invoice = Σ(Student_Base_Fees) + Σ(Teacher_Base_Fees) + Processing_Surcharge
```

Idempotent QPay invoice creation uses an execution signature hash:

```
signature = SHA256(school_id || student_ids_sorted || olympiad_ids_sorted || registration_window_id)
```

Repeated submissions with the same signature return the existing invoice rather than creating a duplicate.

### 7.3 Core Database Schema (Extended)

```sql
CREATE TYPE user_role_enum AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN');
CREATE TYPE target_audience_enum AS ENUM ('STUDENT', 'TEACHER', 'OPEN');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'REFUNDED');
CREATE TYPE mastery_level_enum AS ENUM ('NOT_STARTED', 'INTRODUCED', 'DEVELOPING', 'PROFICIENT', 'MASTERED');
CREATE TYPE risk_flag_enum AS ENUM ('NONE', 'WATCH', 'ENGAGE');

CREATE TABLE users (
    user_id           SERIAL PRIMARY KEY,
    phone_number      VARCHAR(20) UNIQUE NOT NULL,
    email             VARCHAR(150) UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    primary_role      user_role_enum NOT NULL,
    organization_code VARCHAR(50),
    national_id_hash  VARCHAR(64),                 -- hashed, never plaintext
    locale            VARCHAR(10) DEFAULT 'mn-Cyrl',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schools (
    school_id    SERIAL PRIMARY KEY,
    school_code  VARCHAR(50) UNIQUE NOT NULL,
    name         VARCHAR(255) NOT NULL,
    aimag        VARCHAR(50) NOT NULL,
    soum         VARCHAR(100),
    is_urban     BOOLEAN NOT NULL,
    has_boarding BOOLEAN DEFAULT FALSE
);

CREATE TABLE students (
    student_id        SERIAL PRIMARY KEY,
    user_id           INT REFERENCES users(user_id),
    school_id         INT REFERENCES schools(school_id),
    grade             SMALLINT CHECK (grade BETWEEN 1 AND 12),
    is_boarding       BOOLEAN DEFAULT FALSE,
    portable_record_uuid UUID UNIQUE DEFAULT gen_random_uuid()
);

CREATE TABLE parent_child_links (
    link_id    SERIAL PRIMARY KEY,
    parent_id  INT REFERENCES users(user_id),
    student_id INT REFERENCES students(student_id),
    verified   BOOLEAN DEFAULT FALSE,
    UNIQUE(parent_id, student_id)
);

CREATE TABLE olympiads (
    olympiad_id          SERIAL PRIMARY KEY,
    title                VARCHAR(255) NOT NULL,
    subject              VARCHAR(50) NOT NULL,
    grade_min            SMALLINT,
    grade_max            SMALLINT,
    target_audience      target_audience_enum NOT NULL,
    registration_opens   TIMESTAMPTZ NOT NULL,
    registration_closes  TIMESTAMPTZ NOT NULL,
    exam_date            TIMESTAMPTZ NOT NULL,
    venue                VARCHAR(255),
    is_online            BOOLEAN DEFAULT FALSE,
    base_fee_mnt         INTEGER NOT NULL
);

CREATE TABLE registrations (
    registration_id   SERIAL PRIMARY KEY,
    student_id        INT REFERENCES students(student_id),
    olympiad_id       INT REFERENCES olympiads(olympiad_id),
    registered_by     INT REFERENCES users(user_id),    -- teacher or student
    signature_hash    VARCHAR(64) NOT NULL,
    payment_status    payment_status_enum DEFAULT 'PENDING',
    qr_payload        TEXT,                             -- signed QR for ticket
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, olympiad_id)
);

CREATE TABLE invoices (
    invoice_id       SERIAL PRIMARY KEY,
    qpay_invoice_id  VARCHAR(128) UNIQUE,
    school_id        INT REFERENCES schools(school_id),
    issued_to        INT REFERENCES users(user_id),
    total_mnt        INTEGER NOT NULL,
    surcharge_mnt    INTEGER DEFAULT 0,
    signature_hash   VARCHAR(64) UNIQUE NOT NULL,
    payment_status   payment_status_enum DEFAULT 'PENDING',
    ebarimt_id       VARCHAR(128),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mock_test_results (
    result_id        SERIAL PRIMARY KEY,
    student_id       INT REFERENCES students(student_id),
    test_type        VARCHAR(50) NOT NULL,   -- 'EGSH' | 'OLYMPIAD_PRACTICE'
    subject          VARCHAR(50),
    score            INTEGER,
    max_score        INTEGER,
    percentile       NUMERIC(5,2),
    taken_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE concept_mastery (
    mastery_id       SERIAL PRIMARY KEY,
    student_id       INT REFERENCES students(student_id),
    curriculum_strand VARCHAR(100),
    grade_level      SMALLINT,
    level            mastery_level_enum DEFAULT 'NOT_STARTED',
    last_updated     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, curriculum_strand)
);

CREATE TABLE teacher_certifications (
    cert_id          SERIAL PRIMARY KEY,
    teacher_id       INT REFERENCES users(user_id),
    course_id        INT NOT NULL,
    issued_at        TIMESTAMPTZ DEFAULT NOW(),
    cpd_credits      NUMERIC(4,1)
);

CREATE TABLE wellbeing_responses (
    response_id      SERIAL PRIMARY KEY,
    student_id       INT REFERENCES students(student_id),
    week_starting    DATE NOT NULL,
    mood_score       SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
    sleep_score      SMALLINT CHECK (sleep_score BETWEEN 1 AND 5),
    safety_score     SMALLINT CHECK (safety_score BETWEEN 1 AND 5),
    free_text        TEXT,
    crisis_flagged   BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, week_starting)
);

CREATE TABLE risk_flags (
    flag_id          SERIAL PRIMARY KEY,
    student_id       INT REFERENCES students(student_id),
    flag             risk_flag_enum DEFAULT 'NONE',
    signals          JSONB,
    raised_at        TIMESTAMPTZ DEFAULT NOW(),
    resolved_at      TIMESTAMPTZ
);

CREATE TABLE audit_log (
    log_id           BIGSERIAL PRIMARY KEY,
    actor_user_id    INT REFERENCES users(user_id),
    action           VARCHAR(100) NOT NULL,
    target_type      VARCHAR(50),
    target_id        VARCHAR(100),
    metadata         JSONB,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registrations_student     ON registrations(student_id);
CREATE INDEX idx_registrations_olympiad    ON registrations(olympiad_id);
CREATE INDEX idx_mock_results_student      ON mock_test_results(student_id, taken_at DESC);
CREATE INDEX idx_concept_mastery_student   ON concept_mastery(student_id);
CREATE INDEX idx_audit_log_actor_time      ON audit_log(actor_user_id, created_at DESC);
```

---

## 8. Security, Compliance & Non-Functional Requirements

### 8.1 Security

- **JWT in HttpOnly, SameSite=Strict, Secure cookies only.** No client-readable session tokens. (Carried from v1.2.0.)
- **2FA mandatory for Teacher, School Admin, Platform Admin roles.** Optional for Student and Parent. SMS-based OTP via the same gateway used for parent notifications.
- **Multi-tenant row separation:** every query scoped by `organization_code`; cross-tenant reads forbidden except platform admin with audit entry.
- **Transaction idempotency:** signature hash on QPay invoice creation prevents duplicate charges.
- **Encryption at rest:** all PII fields (`phone_number`, `email`, `national_id_hash`) encrypted via PostgreSQL pgcrypto.
- **Encryption in transit:** TLS 1.3 minimum; HSTS enabled.
- **Rate limiting:** per-IP and per-user limits on auth endpoints, AI Tutor sessions, registration endpoints.
- **CSRF protection:** double-submit token on every state-changing request.

### 8.2 Privacy

- **Minors' data:** all features involving children under 16 require parent or guardian linkage. Parental revocation of data sharing is a single button and propagates within 24 hours.
- **Wellbeing data:** crisis-phrase flagging is the only de-anonymization path and is disclosed at consent time. No wellbeing data is used to train AI models.
- **AI Tutor sessions:** student conversations are stored for 90 days for quality review, then automatically purged. Users can request immediate purge.
- **Right to export:** any user can export their full data as JSON.

### 8.3 Compliance

- **Mongolian Personal Data Protection Law (2021)** — full compliance, including data controller registration with the data protection authority.
- **MoE data interoperability standard** (when published) — design ahead of the standard so the Portable Student Record schema can map to it without breaking changes.
- **Accessibility:** WCAG 2.1 AA target by P1 launch; AAA aspiration where reasonable.

### 8.4 Non-Functional Requirements

| Requirement | Target |
|---|---|
| p95 page load on 3G | < 3 seconds |
| p95 form submission on 3G | < 2 seconds |
| Uptime (excluding planned maintenance) | 99.9% |
| Deadline-window concurrent users supported | ≥ 50,000 simultaneous |
| Offline functionality | Full read + queued writes for ≥ 7 days |
| Recovery Time Objective (RTO) | < 1 hour |
| Recovery Point Objective (RPO) | < 5 minutes |
| Audit log retention | 7 years |

---

## 9. Rollout Plan

### Phase 0 — Foundation (Q3 2026)

**P0 modules ship together.** No partial launch — these depend on each other.

- AI Tutor (4.1)
- EGSh Prep Engine (4.2)
- Olympiad Directory & Digital Ticket (4.3)
- Teacher Workspace with Bulk Roster (4.4)
- Offline PWA + SMS fallback infrastructure (5.1, 5.2, 5.3, 5.4, 4.8 SMS portion)
- Auth, RBAC, audit logging, QPay, E-Barimt
- Mongolian + English UI

### Phase 1 — Expansion (Q1 2027)

- Teacher Academy with first 20 courses (4.5)
- Focus Mode (4.6)
- Parent Portal (full, including USSD) (4.8)
- Portable Student Record (4.9) — pending MoE partnership
- Study Abroad Hub v2 (4.10) — all 8 destinations
- Scholarship Aggregator (4.10b)

### Phase 2 — Depth (Q3 2027)

- Wellbeing Pulse (4.7a)
- Boys-at-Risk Early Warning (4.7b)
- AI Application Coach (4.10c)
- Mongolian Alumni Network (4.10d)
- Native mobile wrapper (Capacitor)

### Phase 3 — Optional

- Boarding Bus Tracker (4.7c)
- Third-party publisher onboarding for Olympiad organizers
- API for school SIS integrations

---

## 10. Success Metrics

Tracked monthly; reviewed quarterly by Moza leadership.

### 10.1 Reach Metrics

- Monthly Active Users (MAU) total and by aimag.
- Share of MAU outside Ulaanbaatar (target ≥ 30% by month 12).
- Share of MAU from herder-family-designated schools (target ≥ 8% by month 12).

### 10.2 Equity Metrics

- Median mock EGSh score gap between UB and provincial students (target: narrow by 15 points by month 12).
- Olympiad registration count by soum (target: 3x baseline).
- Teacher Academy completion rate by aimag (target: ≥ 40% of completers from rural aimags).

### 10.3 Learning Metrics

- Average concept mastery gain per active student per month.
- AI Tutor session completion rate.
- Mock test improvement curve per student over 6 months.

### 10.4 Operational Metrics

- p95 page load and form submission latency.
- Deadline-night error rate (target: 0 database outages).
- E-Barimt sync success rate (target: ≥ 99.5%).
- SMS delivery success rate (target: ≥ 98%).

### 10.5 Wellbeing Metrics (Phase 2)

- Wellbeing Pulse weekly response rate among boarding students.
- Time from crisis flag raise to counselor acknowledgement (target: < 24 hours).
- Boys-at-Risk intervention follow-up rate (target: ≥ 70% of flagged students receive teacher contact within 2 weeks).

---

## 11. Open Items & Dependencies

### 11.1 Partnership Dependencies

| Item | Owner | Status | Required by |
|---|---|---|---|
| MoE endorsement of Teacher Academy CPD credits | Moza Leadership | Not started | P1 launch |
| MoE Portable Student Record data-sharing agreement | Moza Leadership | Not started | P1 launch |
| SMS aggregator volume agreement (Mobicom / Unitel / G-Mobile) | Moza Operations | Not started | P0 launch |
| UNICEF / World Bank co-funding for free-tier content | Moza Leadership | Existing relationships | P0 launch |
| Embassy / scholarship-administrator content review | Moza Operations | Not started | P1 Study Abroad launch |

### 11.2 Technical Decisions to Lock Before Build

- LLM vendor selection for AI Tutor (evaluate Claude, GPT-4-class, and Mongolian-finetuned candidates against held-out curriculum benchmark).
- Vector store: pgvector vs. dedicated (recommend pgvector for v2.0.0).
- Native mobile timing: PWA only at P0, or Capacitor wrapper from day one?
- Hosting region: confirm Railway Singapore latency to UB acceptable (measure before committing).

### 11.3 Legal Review Required

- AI Tutor terms of service for minors.
- Wellbeing data handling and crisis-flag protocol.
- Portable Student Record consent flow.
- SMS opt-in compliance with Mongolian telecommunications regulation.

---

## 12. Appendices

### Appendix A — Glossary

| Term | Meaning |
|---|---|
| EGSh / ЭЕШ | Элсэлтийн ерөнхий шалгалт — Mongolia's General University Entrance Exam |
| MLE | Mongolian Language Examination — mandatory component of EGSh since 2013 |
| MEXT | Japanese Ministry of Education Scholarship |
| KGSP / GKS | Korean Government Scholarship Program / Global Korea Scholarship |
| CSC | Chinese Scholarship Council |
| CPD | Continuing Professional Development |
| PSR | Portable Student Record (this PRD) |
| PWA | Progressive Web App |
| RBAC | Role-Based Access Control |
| aimag | Mongolian province |
| soum | Mongolian district (within an aimag) |

### Appendix B — Carried-Forward Decisions From v1.2.0

The following decisions from v1.2.0 are preserved without change:

- Three-role RBAC base (Student / Teacher / Platform Admin) — extended in v2.0.0 to five.
- QPay integration architecture and idempotent invoice signature.
- E-Barimt webhook automation.
- PWA + IndexedDB caching for offline form state.
- Redis async queue for deadline-night surges.
- Next.js + NestJS + PostgreSQL stack.
- HttpOnly / SameSite=Strict / Secure cookie session model.
- Multi-tenant row separation enforced at middleware.
- Cryptographically signed QR ticket payload.

### Appendix C — Explicit Removals From v1.2.0

- The framing of "Information Democratization" as a generic objective — replaced with concrete equity metrics in Section 10.2.
- "Beginner-focused playbook" framing limited to USA + Japan — expanded to 8-destination Study Abroad Hub v2 in Section 4.10.
- Static PDF "Teaching Guide CMS" as a top-level feature — folded into Teacher Academy (Section 4.5) as one component among many.

---

**End of PRD v2.0.0.**
