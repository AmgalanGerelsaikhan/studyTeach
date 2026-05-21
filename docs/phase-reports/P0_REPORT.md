# P0 Phase Report

**Window:** 2026-05-26 → 2026-09-24 · **Headline:** National launch of AI Tutor + EGSh + Olympiad + Teacher Workspace + offline + payments + SMS. **As of 2026-05-20:** all 42 gates `◯ not started` (build kicks off 2026-05-26).

## Mode

This report is **plan-only**. No code exists yet. The user-requested verification loop (typecheck / lint / smoke / auto-diagnose / PR) requires the monorepo from S00. Until S00 ships, evidence per gate is **"will be produced by"** with a concrete artifact pointer.

## Gates at a glance

42 gates across three layers:

- **24 epic gates** (E-001 → E-024) — completion of feature work.
- **10 launch criteria** (L-1 → L-10) — non-functional + compliance gates that block production cutover.
- **8 sprint exit criteria** (S00 → S07) — iterative milestones.

Sprint exits are subsumed by epic completion + launch criteria, so the rest of this report tracks **24 epics + 10 launch criteria = 34 closure gates** organized by sprint.

---

## Sprint S00 — Scaffolding (2026-05-26 → 06-08)

### E-001 · Monorepo + tooling

- **Status:** ◯
- **Owner:** frontend-architect
- **Acceptance:** `pnpm dev` launches both apps; `pnpm test` runs; lint + typecheck green on CI.
- **Evidence required:** green CI run on a sample PR; `package.json` + `pnpm-workspace.yaml` committed.
- **Implementation plan:**
  1. `pnpm init` at root; configure `pnpm-workspace.yaml` covering `apps/*` and `packages/*`.
  2. Scaffold `apps/web` (Next.js 14 + TS strict + Tailwind) and `apps/api` (NestJS + TS strict).
  3. Set up eslint + prettier + lefthook (pre-commit lint + typecheck + unit tests on changed packages).
  4. CI: GitHub Actions running lint + typecheck + tests on every push. Budget <15 min.
  5. `docker-compose.yml` for Postgres 16 (with pgvector) + Redis 7.
- **Risks:** monorepo tool choice (pnpm chosen; lock now). Initial CI may exceed 15-min budget — parallelize aggressively.
- **Blocks:** every subsequent epic.

### E-002 · Postgres + migrations harness

- **Status:** ◯
- **Owner:** database-schema
- **Acceptance:** `pnpm db:migrate` applies a no-op migration + the `users` + `schools` tables from PRD §7.3.
- **Evidence required:** migration file in `apps/api/migrations/`; passing integration test that inserts a fixture user.
- **Implementation plan:**
  1. Choose Prisma vs. TypeORM vs. custom (file an ADR; recommendation: custom SQL via `node-pg-migrate` for full control).
  2. Migration 0001: enums (`user_role_enum`, `target_audience_enum`, `payment_status_enum`, `mastery_level_enum`, `risk_flag_enum`) + `users` + `schools`.
  3. Seed script with 5 Mongolian fixture users + 3 fixture schools across UB / Khentii / Bayankhongor.
  4. `pgcrypto` extension enabled; PII columns encrypted at rest.
- **Risks:** migration tool choice; revisit if Prisma offers a meaningful productivity gain.

### E-006 · Design system port (start)

- **Status:** ◯
- **Owner:** ger-design-system
- **Acceptance:** `StButton`, `StCard`, `StIcon`, `StSoyomboFlame` render in Storybook with tokens from `studyTeach (2)/tokens.css`.
- **Evidence required:** Storybook screenshots; design-system tokens unit-tested for parity with prototype CSS.
- **Implementation plan:**
  1. Port `studyTeach (2)/tokens.css` to `apps/web/styles/tokens.css` 1:1.
  2. Create `apps/web/components/st/` with `StButton`, `StCard`, `StIcon`, `StSoyomboFlame`, `StMeander`.
  3. Storybook config with the Ger Interior theme background (cream felt).
- **Risks:** Mongolian font (Noto Serif Mongolian) loading on dev machines — mitigate via `SETUP.md`.

### E-007 · i18n catalog scaffold + mn-Cyrl baseline (start)

- **Status:** ◯
- **Owner:** mongolian-localization
- **Acceptance:** `mn-Cyrl/common.json` loads; one string renders in a route.
- **Evidence required:** catalog file committed; CI step `pnpm i18n:validate` passes (no missing keys).
- **Implementation plan:**
  1. Pick i18n library (recommendation: `next-intl` for App Router compatibility); file ADR.
  2. Three locales scaffolded: `mn-Cyrl` (default), `mn-Latn` (transliteration), `en`.
  3. Seed `mn-Cyrl/common.json` with ~20 baseline strings: navigation, buttons, error messages.
  4. Root page (`apps/web/app/page.tsx`) renders one Cyrillic string to prove end-to-end load.
- **Risks:** transliteration table (MNS 5217:2012) — vendor or hand-built; recommendation: hand-build for control.

### Sprint S00 exit criteria

All four epics ◯ → ●. Plus three ADRs filed (migration tool, i18n library, monorepo manager) — these become `docs/adr/0011`, `0012`, `0013`.

---

## Sprint S01 — Auth + Design System (2026-06-09 → 06-22)

### E-003 · Auth + sessions + 2FA

- **Status:** ◯
- **Owner:** security-compliance
- **Acceptance:** login/logout/OTP/2FA tested; cookies HttpOnly + SameSite=Strict + Secure.
- **Evidence required:** integration tests for happy path + 2FA + cross-tenant denial; `__Host-st-sid` cookie verified in response headers.
- **Implementation plan:**
  1. Argon2id password hashing in `apps/api/src/lib/crypto/`.
  2. SMS OTP via aggregator sandbox in `apps/api/src/modules/auth/otp.service.ts`.
  3. Session cookie issue + verify in `auth.middleware.ts`.
  4. 2FA enforcement for TEACHER / SCHOOL_ADMIN / PLATFORM_ADMIN via `RolesGuard` + `TwoFactorGuard`.
  5. `/me` endpoint returns identity + role + locale.
- **Risks:** SMS aggregator sandbox flakiness — stub at HTTP boundary in dev; nightly real-aggregator smoke on staging.

### E-004 · Multi-tenant scope middleware

- **Status:** ◯
- **Owner:** security-compliance
- **Acceptance:** every authenticated route filtered by `organization_code`; cross-tenant E2E denied + audited.
- **Evidence required:** `tenant-scope.middleware.ts` + at least one cross-tenant denial test per role.
- **Implementation plan:**
  1. Resolve `organization_code` from session in `tenant-scope.middleware.ts`.
  2. Attach scoped context to request via NestJS DI.
  3. PLATFORM_ADMIN cross-tenant reads emit `audit_log` row.
- **Risks:** missing tenant scope on a future endpoint — mitigate via test that every authenticated route passes through the middleware.

### E-005 · Audit log infra

- **Status:** ◯
- **Owner:** security-compliance
- **Acceptance:** append-only trigger; partitioning; 1 row per sensitive action.
- **Evidence required:** migration with `audit_log` + triggers; test that UPDATE/DELETE raises.
- **Implementation plan:**
  1. Migration 0010: `audit_log` table + UPDATE/DELETE triggers + monthly partitions.
  2. `audit.middleware.ts` wraps every authenticated request with a metadata snapshot.
  3. Service-layer hooks for: login, logout, payment status change, PSR read, cross-tenant read, parent-link revocation.
- **Risks:** partition maintenance — automate via cron job on a `pg_partman`-style helper.

### E-006 · Design system port (continued)

- **Status:** ◯
- **Owner:** ger-design-system
- **Acceptance:** full `St*` inventory matches prototype: `StChip`, `StTab`, `StAvatar`, `StProgress`, `StDivider`, `StPhoneBezel`, `StPhoneScreen`, `StSubjectGlyph`, `StCornerBracket`, `StPatternBand`.
- **Evidence required:** Storybook stories per component; visual snapshots committed.
- **Implementation plan:** complete the inventory from S00; wire `decoration` user-setting toggle through CSS root class.

### E-010 · RBAC role guards

- **Status:** ◯
- **Owner:** security-compliance
- **Acceptance:** 5 role guards exist; deny test passes for each role × restricted route.
- **Evidence required:** `apps/api/src/guards/` with one guard per role + `RolesGuard` composing them.
- **Implementation plan:**
  1. `StudentGuard`, `TeacherGuard`, `ParentGuard`, `SchoolAdminGuard`, `PlatformAdminGuard`.
  2. `RolesGuard` decorator-based: `@Roles(Role.TEACHER, Role.SCHOOL_ADMIN)`.
  3. Negative test per role per restricted route.

---

## Sprint S02 — PWA Shell + Persona Chrome (2026-06-23 → 07-06)

### E-008 · PWA shell + service worker

- **Status:** ◯
- **Owner:** offline-pwa-engineer
- **Acceptance:** installable PWA; SW registered; manifest + icons (Soyombo flame on lacquer + cream variants).
- **Evidence required:** Lighthouse PWA score ≥90; install on iOS Safari + Android Chrome demoed.
- **Implementation plan:**
  1. `apps/web/public/manifest.json` + 192/512 icons.
  2. `apps/web/sw.ts` registration + version bump strategy.
  3. Cache policies per [`OFFLINE_STRATEGY.md`](../OFFLINE_STRATEGY.md): cache-first for static, stale-while-revalidate for catalog APIs, network-first for mutations, never-cache for `/api/wellbeing/*`.

### E-009 · IndexedDB stores + sync queue (start)

- **Status:** ◯
- **Owner:** offline-pwa-engineer
- **Acceptance:** `pending-writes` store + retry loop + idempotency-key generation.
- **Evidence required:** Playwright test that queues a write, disables network, reconnects, sees replay.
- **Implementation plan:**
  1. IndexedDB v1 schema via `idb` library: 6 stores listed in [`OFFLINE_STRATEGY.md`](../OFFLINE_STRATEGY.md).
  2. Sync queue producer (FIFO + UUIDv7 idempotency key).
  3. Background sync consumer with exponential backoff (max 12h).
  4. UI hook `useSyncStatus()` for "queued" indicator.

### E-011 · Student persona chrome · E-012 · Teacher persona chrome (dual mode) · E-013 · Parent persona chrome

- **Status:** ◯ (×3)
- **Owners:** frontend-architect
- **Acceptance:** each persona top-level chrome matches `studyTeach (2)/*.jsx` prototype.
- **Evidence required:** visual snapshot per persona × locale.
- **Implementation plan:** port from prototype JSX; use `St*` components; mode toggle (teacher) persists per user in `users.preferences JSONB`.

---

## Sprint S03 — AI Tutor MVP (2026-07-07 → 07-20)

### E-014 · AI Tutor — RAG + refusals + BKT

- **Status:** ◯
- **Owner:** ai-tutor-engineer
- **Acceptance:** end-to-end tutor turn in Mongolian with citations; 4 refusal scenarios pass; quota enforced; mastery updates.
- **Evidence required:** 50 Mongolian + 20 English regression-suite passes; refusal scenarios green; p95 first-token <2s on 3G with cache.
- **Implementation plan:**
  1. Migration: `ai_tutor_sessions`, `ai_tutor_messages`, `curriculum_chunks` (pgvector vector(1024)).
  2. Ingest seed curriculum (Physics gr.11, Math gr.11, Mongolian gr.11) — enough to demo.
  3. Embedding pipeline (chunk → vector → upsert) — runs offline, not on request path.
  4. RAG retrieval scoped by `lang + grade + subject`.
  5. Refusal classifier in front of LLM (lightweight, in-process).
  6. Canonical refusal text loaded from `i18n/mn-Cyrl/ai-refusals.json`.
  7. Citation appended to every assistant turn.
  8. Bayesian Knowledge Tracing update on `concept_mastery` after each session.
  9. Quota enforcement server-side before LLM call.
  10. Frontend chat UI (three-pane: sessions • chat • concept panel).
  11. Cyrillic/Latin toggle in input bar.
- **Risks:** LLM vendor not yet locked → use mock vendor in dev; configurable. Embedding model for Mongolian → start with multilingual; reevaluate after S07.
- **Decision required:** **LLM vendor selection** (Claude vs. GPT-4-class vs. Mongolian-finetuned). Recommend: Claude (Anthropic) for refusal fidelity + Mongolian competency in eval; fallback Mongolian-finetuned for offline pack only. **Block on user approval before S03.**

---

## Sprint S04 — EGSh + Olympiad (2026-07-21 → 08-03)

### E-015 · EGSh Prep — papers + timed mock + predictor

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** full-length proctored mock + score + band predictor + cohort percentile; offline submit queued.
- **Evidence required:** at least 2 subjects × 4 years of EGSh papers ingested; passing E2E that submits in proctored mode and sees predictor update.
- **Implementation plan:** see [`s04-egsh-olympiad.md`](../sprints/s04-egsh-olympiad.md). Cohort floor: minimum 30 students per cohort or return "insufficient data".

### E-016 · Olympiad Directory + filters + practice

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** directory + filters + practice mock + saved list.
- **Evidence required:** 30 fixture olympiads seeded; filter combination tests passing.
- **Implementation plan:** see [`s04-egsh-olympiad.md`](../sprints/s04-egsh-olympiad.md).

---

## Sprint S05 — Payments + Ticket + Roster (2026-08-04 → 08-17)

### E-017 · Teacher Bulk Roster

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** 1000-row CSV parse + dedupe + national-ID checksum + delegation register; idempotent on re-upload.
- **Evidence required:** large-CSV integration test passing; idempotency test (same upload twice → same row count).
- **Implementation plan:** see [`s05-payments-ticket.md`](../sprints/s05-payments-ticket.md).

### E-019 · Payments — QPay + idempotent invoices

- **Status:** ◯
- **Owner:** payments-integration
- **Acceptance:** QPay sandbox happy path + idempotency under retry; signature dedup verified.
- **Evidence required:** integration test submitting same payload twice → 1 invoice row.
- **Implementation plan:** see [`s05-payments-ticket.md`](../sprints/s05-payments-ticket.md). Signature `SHA256(school_id || students_sorted || olympiads_sorted || window_id)` UNIQUE constraint.

### E-020 · E-Barimt receipt sync

- **Status:** ◯
- **Owner:** payments-integration
- **Acceptance:** webhook → receipt attached + downloadable PDF; retry queue on E-Barimt 5xx.
- **Evidence required:** sync success rate ≥99.5% on staging over 14 days (this rolls up to launch gate **L-5**).
- **Implementation plan:** see [`s05-payments-ticket.md`](../sprints/s05-payments-ticket.md).

### E-021 · Signed Digital Ticket + offline render

- **Status:** ◯
- **Owner:** payments-integration
- **Acceptance:** signed payload + offline render at "venue".
- **Evidence required:** Playwright test renders cached ticket with airplane mode on.
- **Implementation plan:** see [`s05-payments-ticket.md`](../sprints/s05-payments-ticket.md). **HSM-backed key required for prod**; software key acceptable in dev.

---

## Sprint S06 — Analytics + SMS (2026-08-18 → 08-31)

### E-018 · Teacher Analytics Matrix

- **Status:** ◯
- **Owner:** backend-architect
- **Acceptance:** per-student × per-strand mastery matrix + 8-week trend; multi-tenant isolated.
- **Evidence required:** cross-tenant denial test passes; matrix renders against fixture mock results.
- **Implementation plan:** see [`s06-analytics-sms.md`](../sprints/s06-analytics-sms.md).

### E-022 · SMS gateway + outbound templates · E-023 · SMS inbound

- **Status:** ◯ (×2)
- **Owner:** backend-architect
- **Acceptance:** outbound ≤2 UCS-2 segments; STATUS query routes correctly; STOP recorded in audit.
- **Evidence required:** segment-count CI test; staging delivery rate ≥98% (rolls up nowhere; SMS aggregator agreement is **L-10**).
- **Implementation plan:** see [`s06-analytics-sms.md`](../sprints/s06-analytics-sms.md).

---

## Sprint S07 — Surge + Hardening + RC (2026-09-01 → 09-14)

### E-024 · Surge mode (Redis Streams + queue UI)

- **Status:** ◯
- **Owner:** payments-integration
- **Acceptance:** 50K-user simulation passes; queue position UI works (rolls up to **L-3**).
- **Evidence required:** k6 load report (60 min × 50K users, zero data loss).
- **Implementation plan:** see [`s07-surge-hardening.md`](../sprints/s07-surge-hardening.md). Redis Stream `registrations.surge`; single-writer-per-shard.

### Hardening (covers launch gates L-1 ... L-9)

Specific work:
1. **L-1 / L-2 (3G perf):** axe-core CI + 3G profile budget enforcement (`p95 page load <3s`, `form submit <2s`).
2. **L-3 (surge):** load test in S07 above.
3. **L-4 (offline 7-day):** Playwright offline suite running across all P0 flows for 7 simulated days.
4. **L-5 (E-Barimt sync):** sustained ≥99.5% on staging for 14 days — start collection at S05 finish.
5. **L-6 (audit log integrity):** test that every sensitive action emits an `audit_log` row; CI fails if any audited action lacks the hook.
6. **L-7 (WCAG 2.1 AA):** manual sweep with NVDA + JAWS Mongolian; per-PR axe-core sweep already passing.
7. **L-8 (i18n complete):** `pnpm i18n:validate` shows 0 missing keys, 0 `i18n.todo` entries.
8. **L-9 (DPIA filed):** four DPIAs in `docs/compliance/`: QPay, ebarimt, SMS aggregator, LLM vendor. Each reviewed and signed by `security-compliance`.

---

## Launch gate L-10 — External dependencies

These are **not engineering work** but they block production cutover:

- **L-10a SMS aggregator volume agreement** (Mobicom / Unitel / G-Mobile) — owner: AIAA Ops.
- **L-10b UNICEF / World Bank co-funding for free tier** — owner: AIAA Leadership.

**Status:** ◯ both. **Recommended:** lead these conversations starting 2026-05-26 in parallel with S00 to avoid serializing the launch.

---

## Critical decisions blocked on user / leadership

Updated 2026-05-20. Three closed, one elaborated, one open.

| # | Decision | Status | Resolution |
|---|---|---|---|
| D-1 | LLM vendor selection | ● **Closed** | **GPT-4-class** (OpenAI / Azure OpenAI). Mongolian-finetuned preserved as offline-pack option. See [ADR-0011](../adr/0011-llm-vendor-gpt4-class.md). |
| D-2 | Migration tool | ● **Closed** | **Custom SQL via `node-pg-migrate`**. See [ADR-0012](../adr/0012-migration-tool-node-pg-migrate.md). |
| D-3 | i18n library | ● **Closed** | **`next-intl`**. See [ADR-0013](../adr/0013-i18n-library-next-intl.md). |
| D-4 | HSM provisioning for ticket signing key | ● **Closed** | **GCP Cloud KMS, Singapore region** (asia-southeast1). EC_SIGN_P256_SHA256. 2-person export approval. Annual rotation + on suspected compromise. See [ADR-0014](../adr/0014-hsm-gcp-cloud-kms.md). |
| D-5 | Hosting region latency confirmation | ● **Closed** | Measured Mongolia → Singapore RTT **60.3–62.8 ms** (8 ICMP probes, 0% loss) — comfortably under PRD §11.2 <120 ms target. See updated [ADR-0010](../adr/0010-railway-singapore-hosting.md). |

---

## Implementation sequence (recommended)

```
S00 [E-001, E-002, E-006-start, E-007-start]
      └─► S01 [E-003, E-004, E-005, E-006-cont, E-010]
            └─► S02 [E-008, E-009-start, E-011, E-012, E-013]
                  ├─► S03 [E-014]
                  ├─► S04 [E-015, E-016]
                  ├─► S05 [E-017, E-019, E-020, E-021]
                  ├─► S06 [E-018, E-022, E-023]
                  └─► S07 [E-024, hardening for L-1..L-9]
```

Parallelism opportunities (S04 onward):
- AI Tutor (E-014) + EGSh (E-015) can overlap once tutor's session model lands.
- Olympiad (E-016) and Payments (E-019) progress in parallel until ticket signing (E-021) joins them in S05.
- SMS (E-022, E-023) is independent; can run any time after S01 auth lands.

---

## What this report does *not* contain

- Code diffs (none exist yet).
- Live test results (no test runner exists yet).
- Real evidence per gate (build hasn't started).

These appear in subsequent refreshes of this file once S00 lands and CI exists. The artifact at this stage is the **implementation plan and decision list** — the next-action map for the team and leadership.

---

**Next action after S00 lands:** refresh this file with concrete CI links, migration paths, and Storybook URLs as evidence per gate. Convert ◯ → ◐ when work starts; ◐ → ● when evidence is attached.
