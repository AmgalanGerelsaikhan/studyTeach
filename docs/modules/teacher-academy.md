# Module: Teacher Academy (PRD §4.5)

> P1 module. Address the rural teacher quality gap directly with interactive, assessed micro-courses. Owner: `backend-architect` + `frontend-architect`. Content-ops lead: Moza pedagogy team.

## Purpose

Replace static PDF teaching guides with interactive, assessed micro-courses that issue MoE-aligned CPD credits.

## Course shape

- 6-12 micro-lessons of 15-25 minutes each.
- Embedded quizzes per lesson.
- Final assessment (graded).
- Peer-discussion thread (structured, moderated).

## Certification

- Course completion + ≥75% on final assessment issues a digital badge.
- Badges carry MoE-aligned CPD credit value (subject to MoE partnership, see PRD §11.1).
- Each teacher has a CPD transcript visible to their school admin.

## Catalog organization

- By subject (Math, Mongolian Language, Physics, …)
- By grade level (1-12)
- By methodology (active learning, formative assessment, differentiated instruction)
- By language proficiency (English for Teachers track: A1 → B2 over 6 months)

## Cohort mode

- Teachers can enroll in a synchronous cohort with weekly live sessions.
- Otherwise self-paced.

## English for Teachers track

- Structured 6-month A1 → B2 path.
- Oriented around classroom English needs (lesson-planning vocabulary, instruction-giving, parent communication).

## Endpoints

| Method | Path                                      | Notes                       |
| ------ | ----------------------------------------- | --------------------------- |
| `GET`  | `/teacher-academy/courses`                | Filterable catalog          |
| `GET`  | `/teacher-academy/courses/:id`            | Detail + syllabus           |
| `POST` | `/teacher-academy/enrollments`            | Enroll (idempotent)         |
| `POST` | `/teacher-academy/lessons/:id/complete`   | Mark complete               |
| `POST` | `/teacher-academy/assessments/:id/submit` | Submit assessment           |
| `GET`  | `/teacher-academy/certifications`         | Caller's certs + transcript |
| `GET`  | `/teacher-academy/cohorts/:id`            | Cohort details + schedule   |

## Data

- Reads: course catalog tables (new in P1), `teacher_certifications`.
- Writes: enrollments, lesson completions, assessment submissions, `teacher_certifications`.

## UI (per prototype)

- **Course player:** lesson video slot, embedded quiz preview, course syllabus sidebar with progress card (e.g., "6/10 lessons").
- **Catalog grid:** course cards with subject badge, duration, cohort/self-paced label, CPD credits, peer count.
- **Certification view:** badge gallery, transcript, MoE alignment notice.

See `studyTeach (2)/teacher2.jsx` → `TeacherAcademy`.

## Tests

- Enrollment idempotency.
- Assessment scoring against keys.
- Badge issuance at ≥75% threshold.
- Transcript visible to school admin only.

## P1 acceptance

- [ ] First 20 courses live.
- [ ] Cohort scheduling end-to-end.
- [ ] CPD credits issued and visible on transcript.
- [ ] English-for-Teachers A1 launch.
- [ ] Completion rate ≥40% from rural aimags in beta cohort.

## Open dependencies

- MoE endorsement of CPD credit value — owner Moza Leadership (PRD §11.1).
