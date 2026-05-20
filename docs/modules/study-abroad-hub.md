# Module: Study Abroad Hub v2 (PRD §4.10)

> P1 (destinations + scholarship aggregator) and P2 (AI Application Coach + Alumni Network). Owner: `frontend-architect` + `backend-architect`; AI Coach owned by `ai-tutor-engineer`.

## Purpose

Demystify global applications for Mongolian students with no prior knowledge. v1.2.0 covered only USA + Japan; v2.0.0 covers eight destinations plus scholarship aggregator, AI Application Coach, and Mongolian alumni mentor network.

## Destinations (8)

| Destination | Primary Pathway |
|---|---|
| **United States** | Holistic admissions; need-based aid |
| **Japan** | MEXT Scholarship (Embassy); EJU route |
| **South Korea** | KGSP / GKS; TOPIK |
| **China** | CSC; HSK; Belt-and-Road program slots |
| **Russia** | Russian Government Quota; bilateral slots |
| **Germany** | Tuition-free public unis; TestAS; DSH/TestDaF; English-taught Master's |
| **United Kingdom** | UCAS; Chevening; foundation-year pathways |
| **Australia** | Direct UG admission; Australia Awards |

## Sub-modules

### §4.10a — Destination Blueprints (P1)

Each destination has a structured blueprint:

- Core Concept
- Core Requirements
- Financial Pathway
- Application Timeline
- Common Pitfalls

Tab-based UI to prevent content fatigue. Available in Mongolian + English.

### §4.10b — Scholarship Aggregator (P1)

Database of scholarships open to Mongolian nationals:

- Name, funder, level (UG/PG/PhD), destination, eligibility, deadline, application URL, document checklist.
- Filterable by: destination, field of study, level, deadline window, funding type (full / partial / tuition-only).
- Deadline notifications in-app + email + optional SMS.

### §4.10c — AI Application Coach (P2)

Personal statement drafting and critique:

- Reads student's draft and returns structured feedback (clarity, narrative arc, evidence, conclusion).
- Can rewrite individual paragraphs **on request**, marked as **suggestions** (never auto-replacing student's text).
- **Refuses to write the personal statement from scratch.** Requires a draft or structured outline first.

Other features:
- Recommendation-letter checklist for teachers.
- Mock interview generator for scholarships with interview rounds (MEXT, Chevening, KGSP).
- All outputs in Mongolian + English.

### §4.10d — Mongolian Alumni Network (P2)

- Verified alumni studying or graduated from any of the 8 destinations opt in as mentors.
- Verification: alumni provide acceptance letter or student ID, validated by AIAA staff.
- Mentorship is request-based and bounded: one introduction request per applicant per mentor, with a structured form (what is the question, what have you already researched).
- **No DMs, no follower graphs.** Anti-harassment by design.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/study-abroad/destinations` | All 8 with summary |
| `GET` | `/study-abroad/destinations/:code` | Blueprint detail |
| `GET` | `/study-abroad/scholarships` | Filterable aggregator |
| `POST` | `/study-abroad/scholarships/:id/watch` | Deadline subscription |
| `POST` | `/app-coach/sessions` | Start coach session |
| `POST` | `/app-coach/sessions/:id/critique` | Submit draft for critique |
| `POST` | `/app-coach/sessions/:id/rewrite-paragraph` | Suggest rewrite for a paragraph |
| `POST` | `/app-coach/interviews` | Generate mock interview questions |
| `GET` | `/alumni/mentors?destination=…` | Verified mentors |
| `POST` | `/alumni/mentors/:id/intro-request` | Structured intro form |

## Data

- Reads: destination content tables, scholarship registry, alumni registry.
- Writes: coach sessions (retention 90d, then purge), intro requests, deadline subscriptions.

## UI (per prototype)

- **Hub:** destination hero card with country motif (e.g., Japan flag panel for MEXT) + tabbed content (fundamentals / requirements / financial / timeline / pitfalls).
- **Scholarship grid:** institution cards with acceptance %, language exams, financial package.
- **Coach:** chat-like interface but with explicit "submit a draft first" gate.
- **Alumni:** verified-badge mentor cards; intro request opens a structured form.

See `studyTeach (2)/pathway.jsx` → `StudyAbroad`, `ScholarshipAggregator`.

## Tests

- Coach refuses blank-input request.
- Coach rewrite endpoint marks output as suggestion (not auto-replace).
- Alumni intro form requires all structured fields.
- Scholarship deadline subscription delivers reminder at scheduled time.
- All content available in both Mongolian + English.

## P1 acceptance

- [ ] All 8 destination blueprints live in Mongolian + English.
- [ ] Scholarship aggregator with ≥30 scholarships at launch.
- [ ] Deadline subscriptions deliver via in-app + email + optional SMS.

## P2 acceptance

- [ ] App Coach refusal scenarios 100%.
- [ ] Mock interview generator covers MEXT, Chevening, KGSP.
- [ ] Alumni verification process documented + first cohort onboarded.
- [ ] Anti-harassment design verified (no DMs, no follower graphs).
