# P1 Phase Report

**Window:** 2026-11-01 → 2027-03-31 · **Headline:** Teacher Academy + Focus Mode + full Parent Portal + Portable Student Record + Study Abroad Hub v2 + Scholarship Aggregator + Content Packs. **Pre-requisite:** P0 ships and stabilizes for ~30 days.

## Mode

Plan-only. P1 cannot ship until P0 is in production; this report sketches the work and surfaces dependencies that must close in parallel with P0 to keep P1 on schedule.

## Gates at a glance

17 gates:
- **14 epic gates** (E-025 → E-038)
- **3 phase acceptance criteria** (A1-1, A1-2, A1-3)

Two epics are **◇ blocked on external dependencies** that must be unblocked before P1 build can start.

---

## Track 1 — Teacher Academy (E-025 → E-028)

Owner: backend-architect + frontend-architect + content-ops (AIAA pedagogy team).

### E-025 · Teacher Academy — content pipeline + player

- **Status:** ◯
- **Owner:** backend-architect + frontend-architect
- **Acceptance:** course catalog API + lesson player with video slot + embedded quiz + syllabus sidebar; offline-capable for partial-pack schools.
- **Evidence required:** at least 3 courses live in staging; lesson completion + assessment submission tracked in DB.
- **Implementation plan:**
  1. Schema: `courses`, `lessons`, `lesson_completions`, `assessments`, `assessment_submissions`, `enrollments`, `cohorts`.
  2. Lesson player UI from `studyTeach (2)/teacher2.jsx` → `TeacherAcademy`.
  3. Quiz engine reusable across modules.
  4. Catalog filters: subject, grade, methodology, language proficiency.
- **Blocks:** E-026, E-027, E-028.

### E-026 · Teacher Academy — assessments + badges

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** assessment scoring + badge issuance at ≥75% threshold + CPD-credit value attached.
- **Evidence required:** badge issuance test; transcript visible to school admin only.
- **Implementation plan:** schema `teacher_certifications` already in PRD §7.3. Service layer issues badge on threshold; emits audit row.
- **Decision required:** **MoE CPD credit endorsement** — owner AIAA Leadership. If MoE has not signed by mid-P1, badges issue with "pending MoE recognition" label.

### E-027 · Teacher Academy — cohort scheduling

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** cohort enrollment + weekly synchronous-session schedule + reminders.
- **Evidence required:** cohort start → first session → enrollment cap respected.
- **Implementation plan:** cohorts as a table referencing `courses`; scheduled-session jobs via BullMQ.

### E-028 · English-for-Teachers track A1

- **Status:** ◯
- **Owner:** content-ops (engineering integrates)
- **Acceptance:** A1-level course content live; assessment passes a teacher pilot cohort of 30.
- **Evidence required:** pilot completion rate + qualitative feedback.
- **Implementation plan:** content team produces 12 lessons; engineering ingests + tests playback offline.

---

## Track 2 — Focus Mode (E-029)

### E-029 · Focus Mode (teacher + student)

- **Status:** ◯
- **Owner:** frontend-architect
- **Acceptance:** code-based join works on mobile + desktop; restrictions enforced client + server; anonymous summary delivered post-session.
- **Evidence required:** student E2E: cannot navigate to unrelated routes while session is active; tutor stays on assigned topic.
- **Implementation plan:** see [`docs/modules/focus-mode.md`](../modules/focus-mode.md). `focus_sessions` + `focus_participants` tables; `/focus/me/active` polled on every navigation; tutor refusal layer extended for Focus topic restriction.
- **Risk:** kids will try to bypass via second device — feature is honor-system + teacher oversight, not enforcement.

---

## Track 3 — Parent Portal full (E-030 → E-032)

### E-030 · Parent Portal — full view set

- **Status:** ◯
- **Owner:** frontend-architect
- **Acceptance:** mobile-first; child-selector tabs; upcoming olympiads + mock trend + payments + dorm welfare; localized mn-Cyrl + mn-Latn + en.
- **Evidence required:** visual snapshot per child × per locale; cross-tenant isolation E2E.
- **Implementation plan:** see [`docs/modules/parent-portal.md`](../modules/parent-portal.md).
- **Depends on:** P0 SMS infrastructure.

### E-031 · Parent Portal — USSD menu (Mobicom)

- **Status:** ◇ **Blocked on aggregator USSD agreement.**
- **Owner:** backend-architect (engineering); AIAA Ops (agreement).
- **Acceptance:** USSD menu callable; reachable from at least one operator.
- **Evidence required:** end-to-end call from a real feature phone via Mobicom (or Unitel / G-Mobile).
- **Implementation plan:** menu structure documented in [`docs/modules/parent-portal.md`](../modules/parent-portal.md); engineering work is ~2 weeks once aggregator delivers spec.
- **Mitigation if blocked:** ship E-030 (full app + SMS) without USSD; deliver USSD as a follow-on in P2 if needed.

### E-032 · Parent Portal — multi-child + revocation

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** ≥2 children supported; school-access revocation propagates ≤24h.
- **Evidence required:** revocation E2E test with cache-invalidation timing assertion.
- **Implementation plan:** schema already supports via `parent_child_links`. Add revocation column + propagation worker.

---

## Track 4 — Portable Student Record (E-033, E-034)

### E-033 · PSR — materialized view + access grants

- **Status:** ◇ **Blocked on MoE data-sharing agreement.**
- **Owner:** database-schema + backend-architect (engineering); AIAA Leadership (MoE agreement).
- **Acceptance:** materialized view per `students.portable_record_uuid`; access-grant API; every read audited.
- **Evidence required:** read-audit coverage = 100% (matches phase acceptance **A1-3**).
- **Implementation plan:** see [`docs/modules/portable-student-record.md`](../modules/portable-student-record.md).
- **Mitigation if blocked:** ship PSR for **within-school** transfers only (no cross-school migration). Cross-school PSR moves wait for MoE agreement.

### E-034 · PSR — owner audit timeline UI

- **Status:** ◯
- **Owner:** frontend-architect
- **Acceptance:** student/parent sees who read their PSR, when, why.
- **Evidence required:** UI E2E; localized strings.
- **Implementation plan:** felt cream timeline; brass dividers; counselor reads marked distinctly.

---

## Track 5 — Study Abroad Hub v2 (E-035 → E-037)

### E-035 · Study Abroad — 8 destination blueprints

- **Status:** ◯
- **Owner:** content-ops + frontend-architect
- **Acceptance:** all 8 destinations live with Core Concept / Requirements / Financial / Timeline / Pitfalls; mn-Cyrl + en.
- **Evidence required:** content reviewed by an embassy or scholarship-administrator contact per destination.
- **Implementation plan:** schema for `destinations`, `destination_blueprints`; tabbed UI from `studyTeach (2)/pathway.jsx` → `StudyAbroad`.
- **Dependency:** **embassy / scholarship-administrator content review** per destination — owner AIAA Ops (PRD §11.1).

### E-036 · Scholarship Aggregator — registry + filters

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** ≥30 scholarships seeded at launch; filterable by destination / field / level / deadline / funding type.
- **Evidence required:** seed data committed; filter combination tests passing.
- **Implementation plan:** `scholarships` table; registry maintained by content-ops; admin UI for adding entries.

### E-037 · Scholarship deadline notifications

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** in-app + email + optional SMS notification at configurable interval (7d / 1d / day-of).
- **Evidence required:** subscription test; notification arrives at scheduled time.
- **Implementation plan:** BullMQ scheduled jobs reading subscriptions; idempotent dispatch.

---

## Track 6 — Content packs (E-038)

### E-038 · Content packs — generator + signing

- **Status:** ◯
- **Owner:** offline-pwa-engineer
- **Acceptance:** monthly pack generated server-side; signed; verified by PWA before import.
- **Evidence required:** end-to-end: generate pack → distribute → import → verify content available offline.
- **Implementation plan:** server-side generator pulls AI Tutor curriculum + past EGSh + Olympiad directory + Teacher Academy videos; signs with content-pack key; PWA verifies signature; pack importable from USB or local Wi-Fi.
- **Dependency:** P0 telemetry baseline — need to know which content is most-used before optimizing pack contents.

---

## Phase acceptance criteria

### A1-1 · Teacher Academy completion rate ≥40% from rural aimags in beta cohort

- **Status:** ◯
- **Evidence required:** completion-rate query over a beta cohort, aimag-segmented.
- **Implementation plan:** equity dashboard already planned (E-048 in P2 covers refresh; baseline metric available from P0 data).
- **Risk:** if rural enrollment is low, completion rate is undefined — recruit aggressively via SMS push during pilot.

### A1-2 · Parent Portal SMS delivery rate ≥98%

- **Status:** ◯
- **Evidence required:** sustained ≥98% on staging for 14 consecutive days.
- **Implementation plan:** delivery webhook tracking; alerting if rate drops below 95%.
- **Risk:** aggregator outage during measurement window — mitigate with multi-vendor failover if multi-vendor agreement live.

### A1-3 · PSR read-audit coverage = 100%

- **Status:** ◯
- **Evidence required:** test that every read of `psr_<uuid>` emits an `audit_log` row.
- **Implementation plan:** stored-function-only access; trigger-based audit; CI test verifies.

---

## P1 launch checklist

Before declaring P1 shipped:

- [ ] All 14 epics ●.
- [ ] A1-1, A1-2, A1-3 ●.
- [ ] All localized strings reviewed by `mongolian-localization`.
- [ ] WCAG 2.1 AA across all P1 screens.
- [ ] DPIA filed for any new third-party (e.g., new SMS / video host).
- [ ] External: MoE Teacher Academy CPD endorsement (E-026 dependency); MoE PSR data-sharing agreement (E-033 dependency); embassy content review for 8 destinations (E-035 dependency).

## External dependencies (must close before or during P0)

| Dependency | Owner | Required by |
|---|---|---|
| MoE Teacher Academy CPD endorsement | AIAA Leadership | E-026 / P1 launch |
| MoE PSR data-sharing agreement | AIAA Leadership | E-033 / P1 launch |
| USSD aggregator agreement | AIAA Ops | E-031 |
| Embassy / scholarship-administrator review per destination | AIAA Ops | E-035 |

## Critical decisions (deferred until P1 planning starts)

| # | Decision | Required by |
|---|---|---|
| D-6 | Video hosting for Teacher Academy (self-hosted via R2 vs. vendor) | E-025 |
| D-7 | Scholarship notification channel default (in-app only vs. email opt-in) | E-037 |
| D-8 | Content pack distribution mechanism (USB only, local Wi-Fi only, both) | E-038 |
