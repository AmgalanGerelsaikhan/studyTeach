# Testing Strategy

> Owner: `qa-test-engineer`. Companion to [`CODING_STANDARDS.md`](./CODING_STANDARDS.md). Defines what gets tested, where, and how.

## Pyramid

```
       /---\
      | E2E |        Playwright — golden paths, offline, 3G
      |-----|
     | Integ |       Vitest + real Postgres (api), MSW (web)
     |-------|
    |  Unit   |      Vitest — pure logic, mappers
    -----------
```

Heavier focus on integration than typical, lighter on unit. Reason: most of our bugs live at boundaries (multi-tenant scoping, idempotency, offline replay, refusal triggers). Pure logic is thin.

## Layer rules

### Unit (Vitest)

- Pure functions, mappers, guards.
- No I/O. No timers (or use fake timers).
- File: `*.test.ts` next to the source.
- Run on every save.

### Integration — API (Vitest + real Postgres)

- Endpoints exercised end-to-end against a real Postgres.
- **No mocking of Postgres.** Past incident: mocked tests passed but prod migration broke.
- Spin up Postgres via `testcontainers` per worker, or share a CI-only container.
- File: `apps/api/test/**/*.spec.ts`.
- Each test wraps in a transaction that rolls back; or creates and drops a schema per test.

Required tests per endpoint:

- Happy path.
- Auth (401 without session).
- Multi-tenant isolation (403 cross-tenant).
- Idempotency (if mutation): same Idempotency-Key returns same response.
- Validation (400 on malformed input).

### Integration — Web (Vitest + MSW + RTL)

- RSC fetchers, server actions, component composition.
- External APIs stubbed at the HTTP boundary with MSW.
- File: `apps/web/**/*.test.tsx`.

### E2E (Playwright)

- Golden paths: sign up → log in → use the platform's key flow.
- Offline scenarios: disable network mid-write, reconnect, verify replay.
- 3G profile: network throttling per persona.
- Multi-locale: each E2E runs once in `mn-Cyrl` and once in `en` (where applicable).

File: `e2e/<persona>/<flow>.spec.ts`.

### Load (k6)

- Surge simulation: 50K concurrent users for 60 minutes against `/payments/invoices`.
- Tutor concurrency: 1K parallel sessions, measure p95 latency.
- File: `load/*.js`. Run nightly on staging, not in PR CI.

### A11y (axe-core + Playwright)

- Every P0 route has an a11y test.
- Failures are blocking.
- Manual screen-reader sweeps quarterly with NVDA + JAWS Mongolian language pack.

### Visual regression (Playwright snapshots)

- Per-persona-screen snapshots.
- Snapshot changes require explicit acknowledgement in PR.

### Refusal regression

- 50 Mongolian + 20 English curriculum queries.
- Asserted on every AI Tutor prompt change.
- 4 refusal scenarios: exam-mode, write-essay, blank-statement, non-academic redirect.

### Wellbeing crisis classifier

- Held-out Mongolian crisis-phrase corpus.
- Nightly evaluation; precision ≥0.85, recall ≥0.90.
- Threshold drift blocks deploy.

## Fixtures

| Path                                      | Contents                                                    |
| ----------------------------------------- | ----------------------------------------------------------- |
| `apps/api/test/fixtures/mn/students.json` | Mongolian student names (real aimag/soum from geo registry) |
| `apps/api/test/fixtures/mn/teachers.json` | Mongolian teacher names                                     |
| `apps/api/test/fixtures/curriculum/`      | Sample curriculum chunks per grade × subject                |
| `apps/api/test/fixtures/olympiads.json`   | 30 fixture olympiads (real subjects, real aimag venues)     |
| `apps/api/test/fixtures/qpay/`            | Recorded QPay webhook payloads                              |
| `apps/api/test/fixtures/sms/`             | Recorded SMS aggregator inbound/outbound                    |
| `apps/api/test/fixtures/llm/`             | Recorded LLM responses for refusal regression               |

**Never** lorem ipsum. **Never** English-only test data.

## Performance budgets (enforced in CI)

| Metric                                               | Budget |
| ---------------------------------------------------- | ------ |
| Initial JS per route (gzipped)                       | ≤200KB |
| LCP on 3G (per route)                                | ≤2.5s  |
| p95 page load on 3G                                  | <3s    |
| p95 form submit on 3G                                | <2s    |
| API p95 latency (auth, list, detail)                 | <300ms |
| API p95 latency (mutations, with idempotency lookup) | <500ms |

CI fails if any budget regresses by >10%.

## Environments

| Env       | Purpose                                                                       |
| --------- | ----------------------------------------------------------------------------- |
| `local`   | Engineer's laptop — Docker Postgres + Redis + mocked external services        |
| `ci`      | GitHub Actions runner — Postgres testcontainer + MSW                          |
| `staging` | Pre-prod cluster — sandbox QPay + sandbox ebarimt + sandbox SMS + LLM sandbox |
| `prod`    | Live                                                                          |

Tests against `staging` run nightly. Tests against `prod` are read-only smoke (`/health`, `/version`).

## Test data conventions

- Aimag names from the official registry (Архангай, Баянхонгор, Дорнод, …).
- Soum names matching real geography.
- Names follow Mongolian naming conventions: `Ц. Оюунгэрэл` formal, full name in records.
- Phone numbers in `+976` format.
- Currency in MNT with non-breaking space.

## Flakiness policy

- A test that fails 1/20 is broken.
- Quarantine via `it.skip` _with a linked bug_.
- Root-cause within 1 sprint or delete the test.
- Never retry-until-green.

## What we don't test (and why)

- **3rd-party library internals.** We trust pinned versions.
- **Generated code.** Migrations are generated; we test the _behavior_ they produce.
- **Static content.** A typo in `mn-Cyrl/common.json` is a localization review issue, not a test failure.
- **Visual exactness pixel-for-pixel.** Snapshots tolerate 1% diff.

## Test ownership matrix

| Layer                | Owner                                       | Reviewer                                  |
| -------------------- | ------------------------------------------- | ----------------------------------------- |
| Unit                 | feature author                              | feature author                            |
| Integration (API)    | feature author                              | `backend-architect` or `qa-test-engineer` |
| Integration (Web)    | feature author                              | `frontend-architect`                      |
| E2E                  | feature author                              | `qa-test-engineer`                        |
| Load                 | `payments-integration` / `qa-test-engineer` | `qa-test-engineer`                        |
| A11y                 | feature author                              | `ger-design-system`                       |
| Refusal              | `ai-tutor-engineer`                         | `mongolian-localization`                  |
| Wellbeing classifier | `ai-tutor-engineer`                         | clinical reviewer                         |

## CI configuration

CI runs on every push:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:unit`
4. `pnpm test:api` (with Postgres container)
5. `pnpm test:web` (with MSW)
6. `pnpm test:e2e` (subset; full suite nightly)
7. `pnpm test:a11y`
8. `pnpm test:visual`

Total budget: 15 minutes. If we exceed it, parallelize first; cut tests only as a last resort.

## Nightly on staging

- Full E2E suite.
- Load: surge sim + AI Tutor concurrency.
- Refusal regression.
- Wellbeing classifier evaluation.
- Visual regression (full inventory).
