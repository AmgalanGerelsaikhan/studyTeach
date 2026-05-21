# Missing screens · feature-by-feature sprint plan

> Companion to the S00–S04 phase reports. Maps every prototype screen that is
> _not_ yet implemented as a functional surface onto the rollout plan, with
> per-screen acceptance criteria + the existing epic ticket that owns it.
>
> Captured **2026-05-21** after the UI-alignment pass of the five functional
> screens (`/`, `/ai-tutor`, `/parent`, `/egsh`, `/olympiad`).

## Inventory

The `studyTeach (2)/` prototype defines **13 artboards** across 4 personas.
The previous UI audit found that **5 are functional in the app today** and
have been aligned with the mockup (Student home, AI Tutor, Parent portal,
EGSh, Olympiad). The remaining **8** are placeholders or do not exist.
This document covers those 8.

| #   | Screen                 | Mockup ref                                                 | Persona          | Sprint owner | Epic            |
| --- | ---------------------- | ---------------------------------------------------------- | ---------------- | ------------ | --------------- |
| 1   | Digital ticket         | `studyTeach (2)/student2.jsx:256` → `DigitalTicket`        | Student          | **S05**      | E-021           |
| 2   | Teacher dashboard      | `studyTeach (2)/teacher.jsx:93` → `TeacherDashboard`       | Teacher          | **S06**      | E-018           |
| 3   | Teacher bulk roster    | `studyTeach (2)/teacher2.jsx:7` → `BulkRoster`             | Teacher          | **S05**      | E-017           |
| 4   | Teacher Academy        | `studyTeach (2)/teacher2.jsx:143` → `TeacherAcademy`       | Teacher          | **P1**       | E-025 / 26 / 27 |
| 5   | Focus mode (teacher)   | `studyTeach (2)/teacher2.jsx:375` → `FocusModeTeacher`     | Teacher          | **P1**       | E-029           |
| 6   | Focus mode (student)   | `studyTeach (2)/teacher2.jsx:533` → `FocusModeStudent`     | Student          | **P1**       | E-029           |
| 7   | Wellbeing pulse        | `studyTeach (2)/family.jsx:198` → `WellbeingPulse`         | Family / student | **P2**       | E-039 / 40      |
| 8   | School admin risk      | `studyTeach (2)/family.jsx:357` → `SchoolAdminRisk`        | School admin     | **P2**       | E-042           |
| 9   | Study abroad           | `studyTeach (2)/pathway.jsx:5` → `StudyAbroad`             | Student          | **P1**       | E-035           |
| 10  | Scholarship aggregator | `studyTeach (2)/pathway.jsx:295` → `ScholarshipAggregator` | Student          | **P1**       | E-036 / 37      |

(That's 10 entries — 9 distinct mockups; Focus mode is split teacher / student.)

## Per-sprint placement

### S05 — Payments + ticket + roster (already planned 2026-08-04 → 08-17)

Adds **two** of the missing screens. Both depend on the migrations and
signature_hash anchor already in place from S04:

#### 1. Digital ticket (`student2.jsx:256`, E-021)

**Acceptance:**

- `GET /registrations/:id/ticket` returns `{ payload, qr_png_blob }` after
  payment_status flips to `PAID`.
- Signed via the HSM seam (`TICKET_SIGNING_MODE`) — dev key in dev,
  GCP Cloud KMS in staging+prod (ADR-0014).
- Frontend: `/ticket/:registrationId` route inside `(student)`; renders the
  390×844 hero card with brass corner brackets, QR centered, exam date +
  venue + seat. Caches into IndexedDB `tickets` store the moment it loads
  (already-shipped E-009 schema). Offline render verified by service worker
  cache-first policy on `/api/registrations/:id/ticket` — needs to swap from
  the current `NETWORK_FIRST` rule.
- Audit-log row on every fetch + every offline render.

**Cross-cutting:** completes constraint #5 (idempotent QPay invoices) end to
end — invoice → confirmation → ticket → offline render.

#### 2. Teacher bulk roster (`teacher2.jsx:7`, E-017)

**Acceptance:**

- `POST /teacher/rosters` accepts a parsed CSV body (parsing is client-side
  via PapaParse-equivalent); idempotent on `roster_hash = SHA256(school_id ‖
sorted(student_phone_numbers) ‖ window_id)`.
- Creates `students` rows (or upserts on phone_number conflict) under the
  teacher's `organization_code`; bulk-registers them for the selected
  olympiad via the existing `RegistrationService.register` loop with the
  same `signature_hash` shape.
- Frontend: `/teacher/roster` route; drop-zone for CSV, preview grid with
  edit-inline cells, per-row validation badges (phone format, grade range,
  missing required), submit button → progress modal with per-row status.
- Per-cell errors surface inline; submit blocked until 0 errors.

### S06 — Teacher analytics + SMS (already planned 2026-08-18 → 08-31)

Adds **one** missing screen.

#### 3. Teacher dashboard (`teacher.jsx:93`, E-018)

**Acceptance:**

- `GET /teacher/cohort?olympiad_id?` returns per-student mastery + last 3
  mock_test_results in the teacher's organization scope (middleware
  enforces); response stripped of cross-tenant rows.
- Frontend: `/teacher` (replaces the current stub). Three cards:
  cohort metrics (Metric component from `teacher.jsx:317`), mastery matrix
  (`MatrixCell` from `teacher.jsx:336` — student × strand grid coloured by
  level), olympiad roster summary.
- Filter: by class / by olympiad. Cohort floor of **5 students** before
  rendering the matrix (smaller groups would identify individuals).
- All copy mn-Cyrl; PSR access pattern audited.

### P1 — November 2026 onward

#### 4 + 5 + 6. Teacher Academy + Focus modes (E-025/26/27, E-029)

Teacher Academy is a content + assessment + scheduling triple — `teacher2.jsx:143`
covers the course player surface. Focus mode is two surfaces (`teacher2.jsx:375` +
`teacher2.jsx:533`) sharing the same blocked-domains + screen-time policy. Both
get spec'd as a unit in the P1 kickoff. No backend changes needed before then.

#### 9 + 10. Study Abroad + Scholarship Aggregator (E-035 + E-036/37)

Mockups `pathway.jsx:5` (StudyAbroad — Japan blueprint canvas) and
`pathway.jsx:295` (ScholarshipAggregator — 8-country registry). Backend
work: `study_abroad_destinations` + `scholarships` tables, both seed-driven
content tables. Frontend reuses the multi-filter sidebar pattern shipped in
the Olympiad directory; ScholarshipCard at `pathway.jsx:396` is a 1-to-1
component port.

### P2 — Q2 2027 onward

#### 7. Wellbeing pulse (`family.jsx:198`, E-039 + E-040)

5-question weekly check-in, anonymous by default. Crisis-phrase
de-anonymization is the only de-anonymization path (CLAUDE.md constraint #6)
and is gated by the school counselor role.

#### 8. School admin risk (`family.jsx:357`, E-042)

Boys-at-Risk dashboard for school admins — uses the wellbeing model plus
mock_test_results trajectory + olympiad participation. ML model lands in
P2 alongside the dashboard.

## What does NOT change in existing sprints

- S03 + S04 epics that are ● remain ●; nothing in this plan retroactively
  modifies their exit criteria.
- The five functional screens shipped UI alignment **without** moving any
  underlying epic (E-014 / E-015 / E-016) — those scorecards are unchanged.
- The `studyTeach (2)/` prototype itself stays read-only (per CLAUDE.md
  repository map).

## How this plan should be used

1. When S05 kicks off, the **Digital Ticket** and **Bulk Roster** acceptance
   sections above become the ticket descriptions inside the existing E-017
   and E-021 epics. No new epic IDs needed.
2. The **Teacher Dashboard** acceptance section maps directly onto E-018
   in S06.
3. For P1/P2 screens, the per-screen acceptance lines become the rolling
   ticket descriptions inside their already-scheduled epics — they don't
   create new epics; they fill in the UI surface of existing planned work.

There is no overall "missing screens sprint" — every missing screen sits
inside an epic that is already planned in `docs/ROLLOUT_PLAN.md` and
`FEATURE_DEVELOPMENT_PLAN.md`. The contribution of this document is the
per-screen mockup → backend → frontend → acceptance mapping that was missing.
