# Phase P1 roadmap — Teacher Academy + Focus Mode + Parent Portal + PSR + Pathway

**2026-11-01 → 2027-03-31** (~5 months / ~10 sprints).

Companion to `docs/phase-reports/P1_REPORT.md`. P1 has **14 epics** (E-025 →
E-038) and **owns 4 of the 8 missing-screen mockups** from
[`missing-screens-plan.md`](./missing-screens-plan.md): Teacher Academy (#4),
Focus mode teacher (#5), Focus mode student (#6), Study Abroad (#9),
Scholarship Aggregator (#10).

## Sprint breakdown (proposal)

| Sprint     | Dates              | Headline                                        | Epics               |
| ---------- | ------------------ | ----------------------------------------------- | ------------------- |
| **P1.S01** | 2026-11-03 → 11-16 | Teacher Academy content pipeline                | E-025               |
| **P1.S02** | 2026-11-17 → 11-30 | Teacher Academy player + assessments            | E-026 + E-025 cont. |
| **P1.S03** | 2026-12-01 → 12-14 | Teacher Academy cohorts + English-for-Teachers  | E-027 + E-028       |
| **P1.S04** | 2026-12-15 → 12-28 | Focus mode (teacher + student)                  | E-029               |
| **P1.S05** | 2027-01-05 → 01-18 | Parent Portal expansion                         | E-030               |
| **P1.S06** | 2027-01-19 → 02-01 | USSD bridge + multi-child + revocation          | E-031 + E-032       |
| **P1.S07** | 2027-02-02 → 02-15 | PSR view + audit timeline                       | E-033 + E-034       |
| **P1.S08** | 2027-02-16 → 03-01 | Study Abroad — 8 destination blueprints         | E-035               |
| **P1.S09** | 2027-03-02 → 03-15 | Scholarship Aggregator + deadline notifications | E-036 + E-037       |
| **P1.S10** | 2027-03-16 → 03-29 | Content packs + P1 cutover                      | E-038               |

(Two extra weeks across the window absorb holidays + buffer.)

## Per-epic plans

### E-025/26/27 · Teacher Academy (Missing Screen #4)

Mockup: `studyTeach (2)/teacher2.jsx:143 → TeacherAcademy`.

**E-025 (Content pipeline)** — backend tables `academy_courses`,
`academy_modules`, `academy_lessons`, `academy_assets` (video URLs, slide
decks). Ingest CLI reads a YAML manifest produced by content-ops. **20
courses** at launch per PRD §4.4. R-decisions: video hosting on
Cloudflare Stream (R-1); transcripts mandatory mn-Cyrl + optional Latin
(R-2); course-asset CDN cache TTL 7 days (R-3).

**E-026 (Player + assessments)** — frontend `/teacher/personal/academy`
route + course player (video + slide carousel + quiz card). Quiz schema:
multiple-choice or short-answer; auto-graded for MC, teacher self-grades
short-answer. `assessment_attempts` table mirrors `mock_test_sessions`
shape. Acceptance: completion rate metric per course; badge issued on
≥80% across all assessments.

**E-027 (Cohort scheduling)** — `academy_cohorts` table; teacher
enrolls in a scheduled cohort (vs self-paced). Cohort UI shows live
calendar + peer-progress chart (anonymized). Deadline reminders via the
SMS gateway from S06.

### E-028 · English-for-Teachers A1

Single track inside the Academy frame; content-ops authored. Engineering
only ships the asset ingest path — no new code beyond the academy
backbone.

### E-029 · Focus Mode (Missing Screens #5 + #6)

Mockups: `teacher2.jsx:375` (teacher dashboard for class) + `teacher2.jsx:533`
(student-side blocked-domains view).

**Backend:** `focus_sessions` table (student_id, start, end, policy_id,
allowed_domains JSONB, screen_seconds_used INT). `focus_policies` table
seeded by school (default policy + teacher overrides).

**Frontend (teacher):** `/teacher/focus` — class roster with toggle to
arm focus session for selected students, set duration, choose policy.
Live status: who's in focus mode, time remaining, whether they've
left-and-returned to the tab.

**Frontend (student):** `/focus/active` — locked-state view; only allowed
apps + a timer + "I need a break" button (triggers teacher notification,
not a hard unlock). Note: **client-side enforcement only** — same model as
EGSh proctored mode. Mockup explicitly frames it as self-discipline.

### E-030/31/32 · Parent Portal expansion

Builds on the S03 + UI #3 parent portal foundation.

**E-030 (Full view set)** — additional screens: per-child mastery, per-child
olympiad calendar, per-child SMS-history, payment-history. All read-only.

**E-031 (USSD menu)** — Mobicom USSD bridge `*1234#` → menu navigation
returning the most recent updates per child. Blocked external dependency
(Mobicom agreement). Engineering ships the gateway shim + the response
templates; aggregator routing lands when agreement closes.

**E-032 (Multi-child + revocation)** — multi-child accounts; consent
revocation flow per child per category (academic / financial / wellbeing).
PDP Law §10 surface.

### E-033/34 · Portable Student Record (PSR)

**E-033 (Materialized view + access grants)** — `student_psr` materialized
view aggregating `mock_test_results`, `registrations`,
`teacher_certifications`, wellbeing flag history. Refreshed nightly.
Read access requires `psr_grants` row signed by the student (or guardian if
<18). Blocked external dependency (MoE agreement on PSR schema).

**E-034 (Owner audit timeline)** — `/me/psr` student-owned page listing
every access ever made to their PSR (who, when, what they saw). Audit-log
based; immutable.

### E-035 · Study Abroad (Missing Screen #9)

Mockup: `pathway.jsx:5 → StudyAbroad` (Japan blueprint canvas).

**Backend:** `study_abroad_destinations` content table — country, language,
visa overview, average cost, timeline steps (JSONB), key partners.
Seed-driven; content-ops authors 8 destinations: Japan, South Korea, USA,
Germany, UK, Czechia, Russia, Singapore.

**Frontend:** `/abroad` redesigned. Country picker + per-country blueprint
showing the application timeline as a stepped journey card. Reuses the
multi-filter sidebar pattern from Olympiad directory.

### E-036/37 · Scholarship Aggregator (Missing Screen #10)

Mockup: `pathway.jsx:295 → ScholarshipAggregator`.

**E-036 (Registry + filters)** — `scholarships` table (name, country, org,
level, fund_amount, deadline, eligibility JSONB, url). Multi-filter UI
identical pattern to Olympiad directory. ScholarshipCard component from
`pathway.jsx:396` is a 1-to-1 port.

**E-037 (Deadline notifications)** — cron job: 30 days / 7 days / 1 day
before any saved scholarship deadline → SMS via S06 outbound template.
"Saved" list is per-student localStorage v1 + server-side `saved_scholarships`
table v2.

### E-038 · Content packs

Generator + signing CLI that bundles curriculum_chunks + practice_problems

- EGSh past papers into versioned `content-pack-vNN.tar.gz`, signs with
  content-signing key. PWA fetches latest pack opportunistically + serves
  offline. Delta sync between packs.

## Cross-cutting

- **L-8 catalog parity** — every P1 epic adds keys to mn-Cyrl + mn-Latn + en
  - sms.json; the parity gate from S03 enforces.
- **L-7 WCAG AA** — axe-core regression added to every new route.
- **Surge readiness** — registration paths (academy enroll, scholarship
  apply) use the same surge envelope shipped in S07.

## Phase risks

- **MoE PSR agreement** (E-033) — blocks ~3 weeks of work if not closed by
  P1.S07. Mitigation: ship `student_psr` view first; access-grants behind
  feature flag.
- **Mobicom USSD agreement** (E-031) — blocks the USSD epic but not the
  rest of the parent portal expansion.
- **Content-ops authoring throughput** for the 20 Academy courses + 8
  Abroad blueprints. Mitigation: engineering ships the ingest paths
  early so content-ops can load incrementally.

## Phase exit gates (per `docs/phase-reports/P1_REPORT.md`)

- ◯ Teacher Academy completion rate ≥40% from rural aimags in beta cohort
- ◯ Parent Portal SMS delivery rate ≥98%
- ◯ PSR read-audit coverage = 100%

## What stays ◯ at the end of P1 (handoff to P2)

- Wellbeing Pulse (E-039/40/41)
- Boys-at-Risk (E-042)
- AI Application Coach (E-043/44)
- Alumni Network (E-045)
- Capacitor wrapper (E-046)
- Performance pack v2 (E-047)
- Equity dashboards refresh (E-048)
