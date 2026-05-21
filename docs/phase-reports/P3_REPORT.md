# P3 Phase Report

**Window:** Opportunistic (no fixed schedule). **Headline:** Optional features that ship only when an external unlock arrives.

## Mode

Plan-only. **All P3 epics are `◇ blocked`** on external triggers. Engineering pre-work is minimal until a trigger fires; this report captures readiness so the team can move quickly once an unlock arrives.

## Gates

3 epic gates, all blocked:

| ID | Title | Owner | Trigger | Status |
|---|---|---|---|---|
| E-049 | Boarding Bus Tracker | backend-architect + hardware partner | Hardware partner signed | ◇ |
| E-050 | 3rd-party Olympiad publisher onboarding | backend-architect | 6 months of in-house catalog maturity | ◇ |
| E-051 | School SIS API | backend-architect | Demand from ≥3 large SISs | ◇ |

---

## E-049 · Boarding Bus Tracker

### Status

- ◇ **Blocked on hardware partner.**

### Concept

GPS-based check-in for boarding-school shuttles. Student scans QR on boarding; parent gets SMS notification. Optional per school.

### Trigger to unblock

A signed agreement with a Mongolian shuttle hardware vendor (devices, connectivity, support). Owner: Moza Ops.

### Pre-work (zero-cost, can do now)

- Schema sketch: `shuttle_routes`, `shuttle_check_ins`, `shuttle_subscriptions`.
- Identify SMS templates needed (boarding ack, alighting, route delay).
- Survey existing shuttle vendors operating in UB.

### When unblocked

- ~4 weeks engineering work.
- Heavily depends on hardware vendor's API surface; cannot estimate precisely without seeing it.

### Risks

- Hardware vendor lock-in. Mitigation: abstract integration behind `apps/api/src/modules/shuttle/vendor/`; treat current vendor as one implementation.
- Privacy concern: real-time student location is sensitive. Per-parent opt-in only; no aggregate dashboards; full retention only 30 days.

---

## E-050 · 3rd-party Olympiad publisher onboarding

### Status

- ◇ **Blocked on 6 months of in-house catalog maturity** (means: P0 launches Q3 2026, then 6 months of refinement = ~Q1 2027 ready, but in practice this opens to publishers in late P2 / early P3 ~2027 Q4).

### Concept

Allow Olympiad organizers to self-publish events into the Olympiad Directory (E-016) instead of Moza staff entering them centrally. Reduces operational load and broadens catalog.

### Trigger to unblock

In-house catalog reaches ≥100 Olympiads, 6 months of stable operation, no major data-quality incidents.

### Pre-work

- Document the data model + acceptance bar required from publishers.
- Define moderation flow (review queue + Moza staff approval).
- Identify top 5 publishers most likely to onboard first.

### When unblocked

- ~3 weeks engineering work.
- Add `publishers` table + per-publisher API tokens + moderation queue.
- Update Olympiad Directory to surface publisher attribution.

### Risks

- Spam / low-quality submissions. Mitigation: moderation queue mandatory; new publishers gated for first 30 days.
- Reputational risk if a flagged publisher posts misleading content. Mitigation: publisher onboarding agreement + ability to suspend.

---

## E-051 · School SIS API

### Status

- ◇ **Blocked on demand from ≥3 large school information systems.**

### Concept

Expose an API surface so school SIS products (timetables, attendance, grades) can integrate with studyTeach's PSR + analytics. Read-only first; write-back only on stronger trust assertion.

### Trigger to unblock

Documented demand from 3+ major Mongolian SIS vendors with willingness to commit integration time.

### Pre-work

- Maintain a "SIS interest list" in `ops/sis-interest.md` as inquiries come in.
- Sketch which PSR fields are appropriate to expose externally.

### When unblocked

- ~4 weeks engineering work for v1 (read-only).
- Auth via OAuth2 client credentials with rotating keys.
- Rate limiting per SIS partner.

### Risks

- Each SIS has different schema expectations. Mitigation: publish a strict OpenAPI spec; SIS adapts to us, not vice versa.
- PII leakage. Mitigation: per-student opt-in for SIS data sharing.

---

## Sequencing if multiple unlocks arrive

If all 3 unlock simultaneously (unlikely):
1. **E-049 first** — highest tangible safety benefit.
2. **E-051 second** — biggest catalog amplifier (every SIS integration brings new schools).
3. **E-050 last** — moderation overhead, lowest marginal value.

If only one unlocks, ship that one and re-plan capacity.

---

## External dependencies

| Dependency | Owner | Required for |
|---|---|---|
| Shuttle hardware vendor agreement | Moza Ops | E-049 |
| Catalog operational maturity (6 months) | Moza Ops + content-ops | E-050 |
| ≥3 SIS vendors expressing concrete demand | Moza Ops + Moza Leadership | E-051 |

## Critical decisions (deferred until unlock)

None. P3 decisions are made at the time of unlock, not in advance.

## P3 launch checklist (per epic)

Standard P0/P1/P2 checklist applies:
- [ ] Epic gate ●.
- [ ] WCAG 2.1 AA.
- [ ] DPIA for any new third-party.
- [ ] Localization complete.
- [ ] Audit hooks in place for sensitive operations.

---

**Action:** none required now. Re-open this report when an external trigger fires.
