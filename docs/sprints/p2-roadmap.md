# Phase P2 roadmap — Wellbeing + Risk + AI Coach + Alumni + Capacitor

**2027-05-01 → 2027-09-30** (~5 months / ~10 sprints).

Companion to `docs/phase-reports/P2_REPORT.md`. P2 has **10 epics** (E-039 →
E-048) and **owns the last 2 missing-screen mockups** from
[`missing-screens-plan.md`](./missing-screens-plan.md): Wellbeing Pulse (#7)
and School Admin Risk (#8). The other P2 epics fill non-mockup product
surface (AI Application Coach, Alumni network, Capacitor wrapper, etc.).

## Sprint breakdown (proposal)

| Sprint     | Dates              | Headline                                            | Epics |
| ---------- | ------------------ | --------------------------------------------------- | ----- |
| **P2.S01** | 2027-05-04 → 05-17 | Wellbeing pulse — student check-in                  | E-039 |
| **P2.S02** | 2027-05-18 → 05-31 | Wellbeing crisis classifier (Mongolian corpus)      | E-040 |
| **P2.S03** | 2027-06-01 → 06-14 | Wellbeing de-anonymization path + counselor audit   | E-041 |
| **P2.S04** | 2027-06-15 → 06-28 | Boys-at-Risk model + dashboard                      | E-042 |
| **P2.S05** | 2027-07-06 → 07-19 | AI Application Coach — critique + paragraph rewrite | E-043 |
| **P2.S06** | 2027-07-20 → 08-02 | AI Application Coach — mock interview generator     | E-044 |
| **P2.S07** | 2027-08-03 → 08-16 | Alumni network — verification + intro form          | E-045 |
| **P2.S08** | 2027-08-17 → 08-30 | Capacitor wrapper — iOS + Android shell             | E-046 |
| **P2.S09** | 2027-08-31 → 09-13 | Performance pack v2 + delta sync                    | E-047 |
| **P2.S10** | 2027-09-14 → 09-27 | Equity dashboards refresh + quarterly report        | E-048 |

(Slight gap mid-Jun to absorb Mongolia's Naadam holiday Jul 11–13.)

## Per-epic plans

### E-039/40/41 · Wellbeing Pulse (Missing Screen #7)

Mockup: `studyTeach (2)/family.jsx:198 → WellbeingPulse`.

**Foundation (E-039) — student check-in + dorm aggregate.**

- Migration: `wellbeing_check_ins` (student_id, week_iso, responses JSONB,
  submitted_at). Anonymous by default — student_id stored encrypted,
  decryptable only via the counselor de-anonymization path (E-041).
- 5-question weekly check-in (mood + sleep + relationships + academic
  stress + open-text). All in mn-Cyrl, short answer options.
- Frontend: `/wellbeing` (student) — 2-minute flow with brass progress
  bar; submit and see dorm-level aggregate (% of dorm-mates checking in,
  trends over weeks; no per-individual data).

**Classifier (E-040) — Mongolian crisis-phrase corpus.**

- Custom classifier (lightweight in-process) trained on a labeled
  Mongolian-language corpus (curated by mongolian-localization team +
  school counselors). Precision ≥0.85, recall ≥0.90 per A2-1.
- Open-text responses run through classifier; high-confidence positives
  flagged. False-positive rate target <2%.
- Curated regression set in `apps/api/test/fixtures/mn/wellbeing-crisis/`.

**De-anonymization (E-041) — the only path.**

- `POST /wellbeing/de-anonymize/:check_in_id` requires `COUNSELOR` role +
  reason text + writes a dedicated audit_log entry visible to the
  platform admin. Returns the student record + their full pulse history.
- Frontend (counselor-only): triggered crisis flags surface in counselor
  inbox; counselor clicks → modal asks for reason → submit → reveal.
- **No other code path** ever decrypts a check-in's student_id.

### E-042 · Boys-at-Risk dashboard (Missing Screen #8)

Mockup: `studyTeach (2)/family.jsx:357 → SchoolAdminRisk`.

**Model:** combines (a) mock-test trajectory slope (negative over 3
months), (b) olympiad-participation drop, (c) wellbeing pulse responses
(if shared), (d) attendance proxy from session activity. Trained on
historical data; 3-month historical backtest target false-positive rate
<15% per A2-2.

**Surface:** `/school-admin/risk` — student list ordered by risk score;
per-student card shows the contributing factors + suggested intervention
(connect to counselor, refer to academic support). Counselor + admin
roles only.

**Privacy posture:** model never exposes wellbeing-flag history to admins
who don't have counselor role; risk score is a one-way roll-up.

### E-043/44 · AI Application Coach

**E-043 (Critique + rewrite)** — student pastes a personal-statement
draft → AI returns critique (structure + clarity + alignment with the
target program) + a rewritten version of each paragraph as a suggestion.
**Refuses to write the statement from scratch** — `app-coach.refusal.blank-statement`
canonical key (already in the catalog from S03).

**E-044 (Mock interview generator)** — generates Q&A simulating common
interview questions for the chosen target program; records student
answer; AI offers feedback (no recording stored long-term — transcript
only).

### E-045 · Alumni Network

Verified alumni (verified via diploma upload + counselor sign-off);
search by destination country/university; intro form bridges student to
alumni. **No public profiles**, no follower graph (non-goal per CLAUDE.md).

### E-046 · Capacitor wrapper

iOS + Android shells around the PWA; uses Capacitor APIs for: secure
storage (replaces IDB for sensitive caches), camera access for proctored
mode, push notifications. No new screens.

### E-047 · Performance pack v2 + delta sync

Bigger content packs (multi-grade, multi-subject) with delta sync (only
the changed chunks ship between pack versions). Reuses the S07 content
pack signing.

### E-048 · Equity dashboards refresh + quarterly report

Refreshes the equity-metric pipelines from PRD §10. Adds quarterly
report generator (PDF + web view) showing UB ↔ province deltas across
EGSh score, olympiad participation, tutor session minutes, etc.

## Phase risks

- **Wellbeing data sacrosanct** — CLAUDE.md hard constraint #6. Any P2
  work that touches the wellbeing pipeline gets a security-compliance
  review before merge.
- **Mongolian crisis-phrase corpus** is the long pole — needs school
  counselor labeling time, not engineering time. Mitigation: start the
  corpus collection at the start of P1 so it's ready by P2.S02.
- **Boys-at-Risk model bias** — historical data may encode existing
  inequities. Mitigation: external audit of training set before
  production; manual review of risk scores in first quarter.
- **Capacitor binary review** delays for App Store / Play Store. Mitigation:
  Capacitor seam shipped early; review submission can start once the API
  surface freezes.

## Phase exit gates (per `docs/phase-reports/P2_REPORT.md`)

- ◯ Wellbeing crisis-classifier precision ≥0.85, recall ≥0.90
- ◯ Boys-at-Risk false-positive rate <15% on 3-month backtest
- ◯ AI Application Coach refusal scenarios 100%

## What stays ◯ at the end of P2 (P3 opportunistic)

- Bus tracker (E-049 — hardware partner needed)
- 3rd-party Olympiad publishers (E-050 — needs 6 months in-house catalog
  maturity)
- School SIS API (E-051 — needs demand from ≥3 large SISs)
