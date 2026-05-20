# Development Setup

> Onboarding for a new engineer or for a fresh laptop. Aim: from clone to "running locally" in <30 minutes.

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20 LTS |
| pnpm | 9.x |
| Docker | 24+ (for Postgres + Redis) |
| Git | 2.40+ |
| psql client | 16 (matching server) |
| Mongolian Cyrillic keyboard | Required for translation work |

## First-time setup

```bash
# 1. Clone
git clone <repo>
cd teachstudy

# 2. Install deps
pnpm install

# 3. Spin up Postgres + Redis
docker compose up -d postgres redis

# 4. Copy env file
cp .env.example .env.local
# Fill in: DATABASE_URL, REDIS_URL, QPAY_SANDBOX_*, EBARIMT_SANDBOX_*, LLM_VENDOR_KEY, SMS_AGGREGATOR_SANDBOX_*

# 5. Run migrations + seed
pnpm --filter @studyteach/api migrate
pnpm --filter @studyteach/api seed

# 6. Start dev servers
pnpm dev          # runs apps/web (Next.js) + apps/api (NestJS) in parallel
```

Web: http://localhost:3000  •  API: http://localhost:4000

## Environment variables

`.env.local` is git-ignored. Source of truth template is `.env.example`. Never commit real keys.

| Var | Use |
|---|---|
| `DATABASE_URL` | `postgresql://studyteach:dev@localhost:5432/studyteach` |
| `REDIS_URL` | `redis://localhost:6379` |
| `SESSION_SECRET` | 64-byte hex; rotate quarterly in prod |
| `CSRF_SECRET` | 32-byte hex |
| `QPAY_SANDBOX_MERCHANT_ID` | from QPay sandbox account |
| `QPAY_SANDBOX_SECRET` | … |
| `EBARIMT_SANDBOX_URL` | `https://sandbox.ebarimt.mn` |
| `LLM_VENDOR` | `anthropic` \| `openai` \| `local` |
| `LLM_VENDOR_KEY` | per-vendor key |
| `SMS_AGGREGATOR_URL` | sandbox endpoint |
| `SMS_AGGREGATOR_KEY` | sandbox key |
| `CONTENT_PACK_SIGNING_PUBKEY` | hex-encoded ed25519 pubkey (verify-side) |

## Running tests

```bash
pnpm test                  # all unit + integration
pnpm test:unit             # vitest unit only
pnpm test:api              # api integration (spins Postgres container)
pnpm test:web              # web integration (MSW)
pnpm test:e2e              # Playwright (requires `pnpm build && pnpm start`)
pnpm test:e2e:offline      # Playwright offline subset
pnpm test:a11y             # axe-core + Playwright
pnpm test:load             # k6 against staging (NOT local)
```

CI runs everything except `test:load` on every PR.

## Linting & formatting

```bash
pnpm lint        # eslint + tsc --noEmit
pnpm format      # prettier --write
pnpm typecheck   # tsc --noEmit only
```

Pre-commit hook (lefthook) runs `lint` + `typecheck` + `test:unit` for changed packages.

## Working with the design prototype

`studyTeach (2)/` is the design source. To preview:

```bash
cd "studyTeach (2)"
python3 -m http.server 8080
# open http://localhost:8080/studyTeach.html
```

Do not edit prototype files; copy patterns into `apps/web/components/st/`.

## Working with Mongolian content

- Set your OS keyboard to Mongolian Cyrillic for translation work.
- Use `pnpm i18n:validate` to check catalog completeness (no missing keys, no orphan keys).
- Use `pnpm i18n:translit` to regenerate `mn-Latn` from `mn-Cyrl`.
- Use `pnpm sms:budget` to verify SMS templates fit within 2 segments.

## Working offline (locally)

To simulate offline behavior:

```bash
# In Chrome DevTools → Network → "Offline"
# Or via Playwright in tests: page.context().setOffline(true)
```

Service worker is registered in dev. Disable via `NEXT_PUBLIC_SW_DISABLED=1` if it's getting in the way during development.

## Database operations

```bash
pnpm db:migrate            # apply pending migrations
pnpm db:migrate:create     # scaffold a new migration (prompts for name)
pnpm db:migrate:revert     # revert most recent (dev only)
pnpm db:reset              # drop + recreate + seed (dev only)
pnpm db:console            # psql connected to local
```

Migrations live in `apps/api/migrations/`. Naming: `YYYYMMDDHHMMSS__<verb>_<noun>.sql`.

## Working with the AI Tutor locally

- Default vendor is `local` (mock LLM) for offline development.
- To exercise a real vendor, set `LLM_VENDOR` + `LLM_VENDOR_KEY` in `.env.local`.
- Refusal scenarios are testable via `pnpm test:api -- ai-tutor/refusals.spec.ts`.

## Working with payments locally

- QPay sandbox account required. Apply via QPay developer portal.
- E-Barimt sandbox: ask AIAA ops for credentials.
- All payment endpoints work against sandbox keys in dev.
- `pnpm payments:simulate-webhook` posts a fake QPay confirmation to your local API.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `pnpm install` fails on `node-gyp` | Install Xcode CLT (`xcode-select --install`) on macOS |
| Postgres connection refused | `docker compose up -d postgres` and check port 5432 |
| Mongolian text renders as boxes | Install `Noto Serif Mongolian` font system-wide |
| Service worker won't update | Clear site data in DevTools → Application → Storage |
| Tests timeout in CI but pass locally | Likely flake; `qa-test-engineer` will quarantine and investigate root cause; do not retry |

## Useful commands cheat sheet

```bash
pnpm dev                       # everything
pnpm --filter web dev          # web only
pnpm --filter api dev          # api only
pnpm --filter api migrate
pnpm --filter web build
pnpm test:e2e -- --headed      # debug E2E visually
```

## Repo conventions reminder

- Conventional Commits.
- Reference PRD section in commit body: `Refs: PRD §4.2`.
- TS strict everywhere.
- No emoji in product UI (it's allowed in commits and docs).
- Mongolian Cyrillic strings via i18n only, never inline.
- Real Postgres in integration tests, never mocks.
