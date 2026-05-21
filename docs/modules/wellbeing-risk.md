# Module: Wellbeing & Risk (PRD §4.7)

> P2 module. Three sub-modules: Wellbeing Pulse, Boys-at-Risk Early Warning, Boarding Bus Tracker (P3). Owner: `ai-tutor-engineer` (crisis classifier), `backend-architect` (aggregation), `security-compliance` (consent + de-anonymization). Clinical reviewer: Moza pedagogy team.

> **The most sensitive module in the platform. Every change here requires user + Moza review.**

## §4.7a — Wellbeing Pulse (boarding students)

### Purpose

Weekly anonymous 5-question check-in for students in boarding dormitories, surfacing dorm-level trends for counselors and a strictly bounded crisis-flag path.

### Questions (week-by-week, anonymized)

1. Mood (1-5)
2. Sleep (1-5)
3. Safety (1-5)
4. (Optional) free-text — "Yamar yum bna?"
5. Anything else for counselor (optional free-text)

### Aggregation

- School counselor sees a dashboard of dormitory-level trends.
- Never individual identifiers in the aggregate.
- Aggregates re-computed nightly.

### Crisis-flag protocol (the only de-anonymization path)

If a free-text response contains a crisis-indicator phrase (validated Mongolian-language list maintained by Moza + clinical reviewers):

1. Response is flagged by the local classifier (no third-party LLM).
2. De-anonymized **only to a designated counselor** at the student's school.
3. `audit_log` row written immediately.
4. Counselor receives an in-app notification + SMS.
5. SLA: counselor acknowledgement within 24h (PRD §10.5).

**Disclosed at consent time.** Students see the crisis-protocol notice on the consent screen — it cannot be enabled silently.

### Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/wellbeing/responses` | Student submits weekly check-in |
| `GET` | `/wellbeing/dorm/:school_id` | Aggregate trends (counselor + school admin) |
| `POST` | `/wellbeing/flags/:id/acknowledge` | Counselor ack (audited) |

### Data

- `wellbeing_responses` — firewalled. Application reads aggregates only. Crisis flag access via stored function `escalate_crisis_flag(student_id, week)` only.
- No caching. Service worker explicitly skips `/wellbeing/*`.
- Never trains any AI model.

### UI (per prototype)

- **Student mobile (390×844):** intro card "Долоо хоногийн пульс · 5 асуулт, 2 минут". 5-question flow with felt cream surfaces, brass tacks, anonymity notice prominently. Submission screen confirms "Хариулт хадгалагдсан · нэрээ нууцлагдсан".
- **Counselor (school admin):** dorm trend cards (week-over-week mood/sleep/safety), no names.
- **Flag detail (counselor only):** de-anonymized response, with SLA timer and ack button.

See `studyTeach (2)/family.jsx` → `WellbeingPulse`.

### Tests

- Anonymity in aggregate endpoints (no user IDs in response).
- Crisis classifier precision ≥0.85, recall ≥0.90 on held-out corpus.
- De-anonymization path emits audit-log row.
- Service worker never caches `/wellbeing/*`.

---

## §4.7b — Boys-at-Risk Early Warning

### Purpose

Identify male students whose signals match high-dropout-risk patterns and surface them to school admins for *engagement*, not labeling.

### Inputs

- Attendance pattern (from school's existing SIS feed or Moza ingest).
- Mock test performance trajectory.
- Olympiad engagement.
- Parent-reported absences.

### Output

- School admin sees a list of male students whose signals match high-dropout-risk patterns from historical data.

### Framing

**Language matters.** The dashboard surfaces "students who would benefit from intervention" — never "students at risk of failure." All UI copy enforces this. `mongolian-localization` reviews every string.

### Visibility

- School admin + designated teachers only.
- **Never** the student. **Never** other students. **Never** parents.

### Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/risk/boys?school_id=…` | List of flagged students (admin + designated teachers only) |
| `POST` | `/risk/flags/:id/intervention` | Record intervention action (free text, audited) |
| `POST` | `/risk/flags/:id/resolve` | Mark resolved with note |

### Data

- `risk_flags` (`flag: WATCH | ENGAGE`, signals JSONB).
- Backed by a nightly model trained on historical Moza data.
- Intervention notes audited.

### UI (per prototype)

- School admin dashboard: list of cards, each with subtle ember accent strip, framed positively, intervention button.

See `studyTeach (2)/family.jsx` → `SchoolAdminRisk`.

### Tests

- False-positive rate <15% on 3-month historical backtest.
- RBAC: student/parent cannot access.
- Audit log entry on every list view and every intervention.

---

## §4.7c — Boarding Bus Tracker (P3, optional)

Ships only if a hardware partner is secured.

- GPS-based check-in: student scans QR boarding the shuttle.
- Parent receives SMS notification.
- Marked P3.

## Cross-cutting

- All three sub-modules require explicit consent at registration.
- Parental consent if student <16.
- Withdrawal at any time, propagates within 24h.
