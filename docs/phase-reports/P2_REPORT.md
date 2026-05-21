# P2 Phase Report

**Window:** 2027-05-01 → 2027-09-30 · **Headline:** Wellbeing Pulse + Boys-at-Risk + AI Application Coach + Mongolian Alumni Network + Capacitor wrapper + equity dashboards. **Pre-requisite:** P1 ships and stabilizes for ~30 days. **The most sensitive phase in the platform.**

## Mode

Plan-only. P2 contains the **most ethically-sensitive features in the platform** — Wellbeing crisis-flag de-anonymization and Boys-at-Risk early warning. Every change in P2 requires user + Moza clinical reviewer approval. Engineering work starts only after the data and clinical groundwork are in place.

## Gates at a glance

13 gates:
- **10 epic gates** (E-039 → E-048)
- **3 phase acceptance criteria** (A2-1, A2-2, A2-3)

Three external dependencies must close before E-039, E-040, E-041, E-042 can start:
1. Clinical advisory board onboarded (Wellbeing).
2. Mongolian crisis-phrase corpus collected and reviewed.
3. 3+ months of P0 historical data for Boys-at-Risk baseline.

---

## Track 1 — Wellbeing Pulse (E-039, E-040, E-041) · MOST SENSITIVE

> **Every change in this track requires user approval + Moza clinical reviewer sign-off.** No engineering work proceeds without it.

### E-039 · Wellbeing Pulse — student check-in + dorm aggregate

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** weekly 5-question check-in; dorm-level aggregates visible to counselors; no individual identifiers in aggregate.
- **Evidence required:**
  - Schema review by clinical reviewer.
  - Aggregate endpoint test verifying no user IDs leak.
  - Consent flow includes explicit crisis-flag disclosure.
- **Implementation plan:**
  1. Migration: `wellbeing_responses` table per PRD §7.3 (already documented in `DATABASE_SCHEMA.md`).
  2. Firewall: app reads aggregates only via a materialized view; raw rows accessible to `crisis_flag_handler` DB role only.
  3. Student mobile flow: 5-question card stack with felt cream surfaces (per `studyTeach (2)/family.jsx`).
  4. Counselor dorm dashboard: weekly trend cards, no names.
- **Risk:** consent UX must be unambiguous in Mongolian Cyrillic — escalate copy to clinical reviewer.

### E-040 · Wellbeing — crisis classifier (Mongolian corpus)

- **Status:** ◯
- **Owner:** ai-tutor-engineer + external clinical reviewer
- **Acceptance:** classifier achieves precision ≥0.85, recall ≥0.90 on held-out Mongolian crisis-phrase corpus (rolls up to **A2-1**).
- **Evidence required:**
  - Held-out corpus reviewed and signed by clinical advisors.
  - Nightly evaluation report on staging showing thresholds maintained.
- **Implementation plan:**
  1. **Corpus collection** (clinical reviewer-led, 4–8 weeks; runs in parallel with P1).
  2. Model selection: lightweight in-process classifier (no third-party LLM).
  3. Eval harness wired to CI; deploys blocked on threshold regression.
  4. Refusal-equivalent: if classifier is uncertain (low-confidence range), escalate to counselor with explicit "uncertain" tag.
- **Risk:** corpus quality determines everything; cannot ship without clinical sign-off on corpus.

### E-041 · Wellbeing — counselor de-anonymization path + audit

- **Status:** ◯
- **Owner:** security-compliance
- **Acceptance:** de-anonymization happens only via `escalate_crisis_flag(student_id, week)` stored function; every call emits audit row; counselor receives in-app notification + SMS.
- **Evidence required:**
  - Pen test of the de-anonymization path.
  - Audit-log row present for every escalation in a 14-day test.
  - SLA: counselor acknowledgement <24h (rolls up to PRD §10.5 wellbeing metric).
- **Implementation plan:** see [`docs/modules/wellbeing-risk.md`](../modules/wellbeing-risk.md).
- **Risk:** counselor account compromise → entire flagged corpus exposed. Mitigation: 2FA mandatory for counselor role (already in PRD §8.1); per-access audit reviewed weekly.

---

## Track 2 — Boys-at-Risk Early Warning (E-042)

### E-042 · Boys-at-Risk — model + dashboard

- **Status:** ◯
- **Owner:** ai-tutor-engineer + backend-architect
- **Acceptance:** model surfaces "students who would benefit from intervention" (language matters); false-positive rate <15% on 3-month historical backtest (rolls up to **A2-2**); visible to school admin + designated teachers only.
- **Evidence required:**
  - 3-month historical backtest report.
  - Language audit of UI strings by `mongolian-localization` + Moza pedagogy: every string framed positively.
  - Cross-tenant + role-based access E2E.
- **Implementation plan:**
  1. **Baseline data collection** (requires 3+ months of P0 data — starts naturally as soon as P0 ships).
  2. Feature engineering: attendance pattern, mock test trajectory, Olympiad engagement, parent-reported absences.
  3. Model training on historical dropout signals (Moza-provided data with consent).
  4. Dashboard UI per `studyTeach (2)/family.jsx` → `SchoolAdminRisk`.
  5. Intervention recording: free-text + audit row per intervention.
- **Risk:** false negatives are worse than false positives in this domain. Tune for high recall first; accept higher false-positive rate as long as the framing is positive ("opportunity flagging"). **Clinical reviewer must sign off on the threshold.**

---

## Track 3 — AI Application Coach (E-043, E-044)

### E-043 · AI Application Coach — critique + paragraph rewrite

- **Status:** ◯
- **Owner:** ai-tutor-engineer
- **Acceptance:** critique returns structured feedback; rewrite is a marked suggestion (never auto-replaces); **refuses blank input** (rolls up to **A2-3**).
- **Evidence required:** refusal regression: 100% of blank-input scenarios trigger canonical refusal in Mongolian Cyrillic + English.
- **Implementation plan:** see [`docs/modules/study-abroad-hub.md`](../modules/study-abroad-hub.md) §4.10c.
- **Depends on:** E-035 (Study Abroad scaffolding from P1).

### E-044 · App Coach — mock interview generator

- **Status:** ◯
- **Owner:** ai-tutor-engineer
- **Acceptance:** generator covers MEXT, Chevening, KGSP interview rounds.
- **Evidence required:** scenario test per scholarship; output in mn-Cyrl + en.
- **Implementation plan:** prompt templates per scholarship; recorded answer playback; structured critique.

---

## Track 4 — Mongolian Alumni Network (E-045)

### E-045 · Alumni Network — verification + intro form

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** verified alumni opt-in as mentors; intro requests are structured (no DMs, no follower graph); one request per applicant per mentor.
- **Evidence required:** anti-harassment design review; verification process documented.
- **Implementation plan:** `alumni_profiles` + `mentor_intros` tables; verification via uploaded acceptance letter or student ID, reviewed by Moza staff; intro form with required structured fields.
- **Risk:** verification scales poorly without automation. Plan for Moza-staff bottleneck or partial automation (parse common acceptance letter formats).

---

## Track 5 — Native wrapper (E-046)

### E-046 · Capacitor wrapper (iOS + Android)

- **Status:** ◯
- **Owner:** frontend-architect
- **Acceptance:** Capacitor wrapper distributes the PWA via App Store + Play Store; offline behavior preserved.
- **Evidence required:** approved app on both stores; offline E2E matches P0 baseline.
- **Implementation plan:** thin Capacitor shell over the existing PWA. **Depends on P0 PWA stable for 30+ days.**
- **Risk:** Apple review may reject PWA wrappers — have a fallback plan (richer native chrome if rejected).

---

## Track 6 — Performance + observability (E-047, E-048)

### E-047 · Performance pass — content pack v2 + delta sync

- **Status:** ◯
- **Owner:** offline-pwa-engineer
- **Acceptance:** v2 packs use delta sync (only changed chunks); 50%+ pack-size reduction vs. v1 (E-038).
- **Evidence required:** size comparison + integrity verification.
- **Implementation plan:** delta encoding on content-pack diff; PWA applies deltas.
- **Depends on:** P0 telemetry baseline (need usage data to know what to compress).

### E-048 · Equity dashboards refresh + quarterly report

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** dashboards refresh nightly; quarterly report sent to Moza leadership.
- **Evidence required:** dashboard live in Grafana; report template + first quarterly send.
- **Implementation plan:** equity metrics already defined in [`docs/MONITORING.md`](../MONITORING.md). Report generator runs as a scheduled BullMQ job.

---

## Phase acceptance criteria

### A2-1 · Wellbeing crisis-classifier precision ≥0.85, recall ≥0.90

- **Status:** ◯
- **Evidence required:** held-out corpus evaluation; weekly stability check; clinical reviewer sign-off.
- **Implementation plan:** nightly evaluation in CI; deploy blocked on regression.

### A2-2 · Boys-at-Risk false-positive rate <15% on 3-month historical backtest

- **Status:** ◯
- **Evidence required:** backtest report; clinical reviewer sign-off on threshold.
- **Implementation plan:** see E-042.

### A2-3 · AI Application Coach refusal scenarios 100%

- **Status:** ◯
- **Evidence required:** refusal regression suite green.
- **Implementation plan:** see E-043.

---

## External dependencies

| Dependency | Owner | Required by |
|---|---|---|
| Clinical advisory board onboarded | Moza Leadership | E-039, E-040, E-041, E-042 |
| Mongolian crisis-phrase corpus collected + reviewed | Clinical reviewer + ai-tutor-engineer | E-040 |
| 3+ months of P0 historical data | (auto-accrues once P0 ships) | E-042, E-047 |
| App Store + Play Store developer accounts | Moza Ops | E-046 |

## Critical decisions

| # | Decision | Required by |
|---|---|---|
| D-9 | Wellbeing classifier — vendor model vs. local (in-process) | E-040 |
| D-10 | Boys-at-Risk threshold — recall vs. precision tradeoff | E-042 |
| D-11 | Capacitor — wrap PWA vs. richer native chrome | E-046 |

## P2 launch checklist

- [ ] All 10 epics ●.
- [ ] A2-1, A2-2, A2-3 ●.
- [ ] Clinical advisory board signed off on Wellbeing + Boys-at-Risk.
- [ ] Audit-log review for the de-anonymization path (counselor access patterns).
- [ ] App Store + Play Store apps approved.
- [ ] DPIA filed for any new model vendor.
- [ ] User communications drafted in mn-Cyrl for crisis-flag escalation.
