# Module: Teacher Administrative & Resource Workspace (PRD §4.4)

> Dual-mode dashboard for teachers acting as institutional coordinators *and* personal competitors *and* CPD learners. Owner: `backend-architect` + `frontend-architect`.

## Purpose

A single workspace for the three hats every Mongolian teacher wears: managing students, competing personally, growing professionally.

## Dual-mode toggle

Top-level toggle: **Administration Mode ("My Students")** vs. **Competitor Mode ("My Competitions")**. Prevents cognitive overload. State persisted per user.

## Sub-features

### Bulk Roster Upload

- Drag-and-drop CSV or Excel parser.
- Schema: `[Student Name, National Registration ID, Grade, Selected Olympiad Tracks]`.
- Validates national ID checksum.
- Deduplicates within school.
- Returns row-level errors.
- Idempotent — uploading the same roster twice does not duplicate rows.

### Student Analytics Matrix

- Per-student and per-class views of mock-test results.
- Heat-matrix: rows = students, columns = curriculum strands; cells colored by mastery level.
- Identifies weak conceptual areas before exam dates.
- Hover reveals last-3 mock test scores.

### Teacher Olympiad Hub

- Separate competition track for in-service teachers: pedagogy tournaments, subject-master challenges, curriculum-design competitions.
- Tickets isolated from school delegation rosters.

### Personal Registration Tracker

- Teacher's personal Olympiad tickets, completely separated from school delegation.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/teacher/rosters` | Upload roster (multipart) |
| `GET` | `/teacher/rosters/:id/validation` | Row-level errors after parse |
| `POST` | `/teacher/delegations/:olympiad_id` | Bulk-register selected students |
| `GET` | `/teacher/analytics?class_id=…&subject=…` | Mastery matrix |
| `GET` | `/teacher/olympiads` | Teacher-track competitions |
| `GET` | `/teacher/me/registrations` | Personal registrations |

## Data

- Reads: `students`, `mock_test_results`, `concept_mastery`, `olympiads`, `registrations`.
- Writes: `students` (via roster), `registrations`.

## UI (per prototype)

- **Sidebar:** mode toggle + nav (Удирдлагын самбар, Сурагчид, Бүртгэл оруулах, Шинжилгээ, Багшийн академи, Фокус горим, Хичээлийн материал).
- **Dashboard (admin mode):** metric strip (class size, registered olympiads, avg EGSh predicted score, students needing attention), mastery matrix card, delegation status card (radial), Boys-at-Risk teaser, mock-test trend chart.
- **Roster upload:** stepper UI (file → validation → confirm → submit), row-level error chips, undo before final submit.

See `studyTeach (2)/teacher.jsx` → `TeacherDashboard` and `studyTeach (2)/teacher2.jsx` → `BulkRoster`.

## Tests

- Roster checksum validation.
- Dedup within school across uploads.
- Mastery matrix correctness from fixture mock results.
- Cross-tenant isolation: a teacher cannot see another school's students.

## P0 acceptance

- [ ] Roster upload tolerates 1000-row CSV.
- [ ] All checksum errors render as row chips.
- [ ] Dual-mode toggle persists per user.
- [ ] Delegation invoice idempotent.
- [ ] Boys-at-Risk teaser links to admin dashboard (read-only for teachers).
