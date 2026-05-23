# Deploying MozaTeach to Railway (Singapore)

> Concrete first-deploy walkthrough for this exact repo: pnpm monorepo, `apps/web` (Next.js 14, port 3000), `apps/api` (NestJS, port 4000), Postgres 16 + pgvector, Redis 7. Target: Railway Singapore (per [PRD.md](../PRD.md) — 60–62 ms RTT validated).
>
> Companion to [DEPLOYMENT.md](./DEPLOYMENT.md), which covers ongoing release procedure, rollback policy, and DR targets. This doc is the provisioning runbook.

**Caveat:** until you have a real domain, the [CLAUDE.md](../CLAUDE.md) hard constraint #8 (`HttpOnly + SameSite=Strict + Secure` cookies) is partially compromised — `Strict` cross-origin between two `*.up.railway.app` subdomains works, but you cannot share a cookie between web and api without a shared registrable parent. Plan on a real domain before public launch.

---

## 0. Accounts you'll need

| Service                         | Why                                                  | Cost (start)                          |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| Railway                         | host (web, api, postgres, redis)                     | $5 free trial, then ~$20–40/mo for P0 |
| Cloudflare R2                   | object storage (PDFs, content packs, signed tickets) | ~free at this scale                   |
| Sentry (optional)               | error tracking                                       | free tier 5k events/mo                |
| Better Stack / Axiom (optional) | log aggregation                                      | free tier                             |
| QPay sandbox + ebarimt sandbox  | already in `.env.example`                            | free                                  |

Skip OpenAI / Cloudflare Stream / SMS aggregator keys for now — they're feature-flagged (`LLM_VENDOR=mock`, Stream returns 503, SMS is optional in dev).

---

## 1. Provisioning on Railway

### 1.1 Create the project

```bash
brew install railway
railway login
cd /path/to/teachstudy
railway init   # name it "mozateach-prod"
```

Pick **Singapore (asia-southeast1)** as the region for every service. Latency is the whole point of that PRD note.

### 1.2 Add Postgres (with pgvector)

Dashboard → **+ New → Database → Add PostgreSQL**. Railway's current Postgres template includes pgvector; your existing migration [apps/api/migrations/1748390400000_init-enums-users-schools.sql](../apps/api/migrations/1748390400000_init-enums-users-schools.sql) already runs `CREATE EXTENSION IF NOT EXISTS vector`.

To verify before deploying api: open the Postgres service → **Data** tab → run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

If that fails, switch to the `pgvector/pgvector:pg16` Docker image: Settings → Source → Docker Image → `pgvector/pgvector:pg16` and re-deploy. Same image as your [docker-compose.yml](../docker-compose.yml).

Railway exposes the connection string as `${{Postgres.DATABASE_URL}}` — reference it from api, don't paste it.

### 1.3 Add Redis

**+ New → Database → Add Redis**. Done. Exposes `${{Redis.REDIS_URL}}`.

### 1.4 Deploy the API service

**+ New → GitHub Repo → pick your repo**. Then in service settings:

| Setting            | Value                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Root directory     | `/` (monorepo root — Nixpacks needs to see `pnpm-lock.yaml`)                                                         |
| Build command      | `pnpm install --frozen-lockfile && pnpm --filter @studyteach/contracts build && pnpm --filter @studyteach/api build` |
| Start command      | `pnpm --filter @studyteach/api exec node dist/main.js`                                                               |
| Pre-deploy command | `pnpm --filter @studyteach/api run db:migrate`                                                                       |
| Healthcheck path   | `/health` (add the route if missing — `@Get('/health')` returning `{ ok: true }`)                                    |
| Port               | `4000` (or `$PORT` — see below)                                                                                      |

Railway injects a `PORT` env var. `apps/api` currently reads `API_PORT`. Either:

- Add `API_PORT=${{PORT}}` to the api service env, OR
- Change [apps/api/src/main.ts](../apps/api/src/main.ts) to read `process.env.PORT ?? process.env.API_PORT ?? 4000` (cleaner).

**API env vars** (Settings → Variables):

```bash
NODE_ENV=production
PORT=4000
API_PORT=${{PORT}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# 64-byte and 32-byte hex. Generate locally and paste:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=<paste>
CSRF_SECRET=<paste>

# CORS allowlist for cookies — must match the web service URL exactly
WEB_ORIGIN=https://mozateach-web-production.up.railway.app

# Feature flags — leave mock/dev until you have keys
LLM_VENDOR=mock
TICKET_SIGNING_MODE=dev           # switch to gcp-kms before public launch (ADR-0014)
QPAY_SANDBOX_MERCHANT_ID=
QPAY_SANDBOX_SECRET=
EBARIMT_SANDBOX_URL=https://sandbox.ebarimt.mn
EBARIMT_API_KEY=
SMS_AGGREGATOR_URL=
SMS_AGGREGATOR_KEY=
```

Deploy. Watch logs. Migrations run on every deploy via the pre-deploy command — idempotent because they all use `IF NOT EXISTS`.

### 1.5 Deploy the Web service

**+ New → GitHub Repo → same repo**.

| Setting          | Value                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Root directory   | `/`                                                                                                                  |
| Build command    | `pnpm install --frozen-lockfile && pnpm --filter @studyteach/contracts build && pnpm --filter @studyteach/web build` |
| Start command    | `pnpm --filter @studyteach/web exec next start -p $PORT`                                                             |
| Healthcheck path | `/`                                                                                                                  |

**Web env vars:**

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://mozateach-api-production.up.railway.app
# Anything non-public the web server-routes need (LLM keys, etc.) lives here, not in NEXT_PUBLIC_*.
```

You'll know the exact `*.up.railway.app` URLs only after the first deploy — deploy api first, copy its URL into `WEB_ORIGIN`, then deploy web and copy _its_ URL back into the api's `WEB_ORIGIN`. Bootstrap dance.

### 1.6 Object storage — Cloudflare R2

Railway has no built-in object store. Use **Cloudflare R2** (S3-API, no egress fees):

1. Cloudflare dashboard → R2 → Create bucket: `mozateach-prod` (Asia-Pacific jurisdiction).
2. R2 → Manage R2 API Tokens → Create Token (Object Read+Write on this bucket).
3. Add to api env:
   ```
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=mozateach-prod
   S3_ACCESS_KEY_ID=<token>
   S3_SECRET_ACCESS_KEY=<secret>
   ```

Wire into whichever S3 module exists in [apps/api/src](../apps/api/src) — if it's not built yet, this sits there until needed.

### 1.7 Env-var matrix (single source of truth)

| Variable                        | Web | API | Notes                                       |
| ------------------------------- | :-: | :-: | ------------------------------------------- |
| `DATABASE_URL`                  |     |  x  | Railway ref `${{Postgres.DATABASE_URL}}`    |
| `REDIS_URL`                     |     |  x  | Railway ref `${{Redis.REDIS_URL}}`          |
| `SESSION_SECRET`                |     |  x  | 64-byte hex, rotate quarterly               |
| `CSRF_SECRET`                   |     |  x  | 32-byte hex                                 |
| `WEB_ORIGIN`                    |     |  x  | exact https URL of web service              |
| `PORT` / `API_PORT`             |  x  |  x  | Railway injects `PORT`                      |
| `NEXT_PUBLIC_API_URL`           |  x  |     | the only public URL var                     |
| `LLM_VENDOR` / `OPENAI_API_KEY` |     |  x  | `mock` until you have a key                 |
| `QPAY_SANDBOX_*`                |     |  x  | sandbox until real merchant approval        |
| `EBARIMT_*`                     |     |  x  | sandbox first                               |
| `SMS_AGGREGATOR_*`              |     |  x  | optional for now                            |
| `TICKET_SIGNING_MODE`           |     |  x  | `dev` → `gcp-kms` before launch (ADR-0014)  |
| `CLOUDFLARE_STREAM_*`           |     |  x  | leave blank — player degrades to transcript |
| `S3_*`                          |     |  x  | R2 credentials                              |

---

## 2. Domain + TLS + Cloudflare CDN

> Skip this until you have a domain. Until then, `*.up.railway.app` ships with auto-TLS and works.

### 2.1 Buying a domain

Recommendation: **Cloudflare Registrar** (`.com` ~$10/yr at cost) since Cloudflare is already in your stack. Avoid Namecheap (renewal upcharges) and GoDaddy (privacy upsells).

For Mongolia, `.mn` goes through MNNIC-accredited registrars (Datacom, MobiNet). Slower, but `mozateach.mn` is on-brand. Use `.com` for global, `.mn` for local trust signal.

### 2.2 Wire it up

Plan to use:

- `mozateach.com` → web service
- `api.mozateach.com` → api service

In Cloudflare:

1. Add the site → it'll give you 2 nameservers — set those at your registrar.
2. DNS → add records:

   | Type  | Name                     | Target                                    | Proxy                  |
   | ----- | ------------------------ | ----------------------------------------- | ---------------------- |
   | CNAME | `@` (or `mozateach.com`) | `mozateach-web-production.up.railway.app` | Proxied (orange cloud) |
   | CNAME | `api`                    | `mozateach-api-production.up.railway.app` | Proxied (orange cloud) |
   | CNAME | `www`                    | `mozateach.com`                           | Proxied                |

3. SSL/TLS → set encryption to **Full (strict)**. Railway terminates TLS on its side; Cloudflare does CDN + WAF.
4. In Railway: each service → Settings → Networking → Custom Domain → add `mozateach.com` (web) and `api.mozateach.com` (api). Railway will say "Pending DNS" then "Active".
5. Update env vars:
   - api `WEB_ORIGIN=https://mozateach.com`
   - web `NEXT_PUBLIC_API_URL=https://api.mozateach.com`
6. **Now you can enable cookie-sharing properly.** With both subdomains under `mozateach.com`, set cookies with `Domain=.mozateach.com; SameSite=Strict; Secure; HttpOnly`. Without a shared registrable domain you cannot satisfy CLAUDE.md #8 in spirit — this is the moment to flip it.

### 2.3 Cloudflare WAF & cache rules

- **WAF → Managed Rules**: enable the OWASP Core Ruleset at "Medium" sensitivity.
- **Rate limiting**: cap `/auth/*` to 30 req/min/IP. Cap `/qpay/webhook` to 600 req/min from QPay IPs only (Page Rule with IP allowlist once you have the official QPay webhook source IPs).
- **Cache rules**: bypass cache for `api.mozateach.com/*`. For `mozateach.com`, let Next.js's own headers drive cache (Cloudflare honors `s-maxage`).
- **Bot Fight Mode**: on. **Crawler hints**: on.

---

## 3. CI/CD from GitHub

[.github/workflows/ci.yml](../.github/workflows/ci.yml) already runs lint / typecheck / migrate / build / test on every push and PR. Railway adds the deploy half.

### 3.1 Auto-deploys

Each Railway service → Settings → Source → **Auto Deploy: main**. On every push to `main`, Railway rebuilds and runs the pre-deploy migration. PR pushes don't auto-deploy.

### 3.2 Preview environments per PR

Railway → Project → Settings → **PR Environments: enabled**. Each PR gets an ephemeral `*.up.railway.app` URL with its own DB. Cost scales with how many PRs you keep open — turn off if it gets expensive.

### 3.3 Gate deploys on CI passing

Out of the box, Railway deploys on push regardless of CI status. To gate:

- GitHub repo → Settings → Branches → Branch protection rule for `main` → require the `build` job from `ci.yml` to pass before merge.
- Disable direct pushes to `main` (everyone goes through PRs).

CI is the gate; Railway just deploys whatever lands on `main`.

### 3.4 Rollback

Railway → API service → **Deployments** tab → click any prior deployment → **Redeploy**. Migrations are forward-only; if a deploy adds a destructive migration, write a paired down-migration and commit a revert PR — don't roll back the DB via the dashboard.

---

## 4. Observability + backups + DR

### 4.1 Logs

Railway streams stdout/stderr per service — fine for spot-checking, awful for searching. Add **Better Stack Logs** or **Axiom**:

1. Better Stack → Sources → add HTTP source → copy the token.
2. Railway api/web service → Settings → **Log Drains** → HTTP → paste the Better Stack endpoint.

`apps/api` uses `pino` — already structured JSON, perfect for log aggregation. Make sure prod runs `pino` without `pino-pretty` (conditional on `NODE_ENV` in most setups; verify).

### 4.2 Errors

`pnpm add @sentry/nextjs` in `apps/web` and `@sentry/node` in `apps/api`. Init in each app's bootstrap:

```ts
// apps/api/src/main.ts (top of bootstrap)
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1, environment: 'production' });
```

Set `SENTRY_DSN` per service. **CLAUDE.md #6: never log wellbeing data.** Add a Sentry `beforeSend` hook that drops events from any `/wellbeing/*` route.

### 4.3 Metrics + uptime

- **Railway** gives CPU/RAM/network per service — built in. Look at it weekly.
- **Better Stack Uptime** (or UptimeRobot): hit `https://api.mozateach.com/health` every 60s from Singapore + Hong Kong + Frankfurt regions. Alert to email + Telegram.

### 4.4 Postgres backups

Railway Postgres has **automatic daily backups** retained for 7 days on the Pro plan.

- Postgres service → **Backups** tab → confirm "Daily" is on.
- Set up your own weekly off-site dump too — Railway going down also takes its backups offline:

  ```bash
  # Run from a tiny GitHub Action on cron, or a Railway cron service:
  pg_dump "$DATABASE_URL" --format=custom | \
    aws s3 cp - s3://mozateach-backups/$(date +%Y-%m-%d).dump \
      --endpoint-url=https://<account-id>.r2.cloudflarestorage.com
  ```

### 4.5 Restore drill (do this once before launch, then quarterly)

```bash
# 1. Spin up a scratch Postgres anywhere
docker run -d --name pg-restore -p 5434:5432 -e POSTGRES_PASSWORD=test pgvector/pgvector:pg16
# 2. Restore
pg_restore -h localhost -p 5434 -U postgres -d postgres latest.dump
# 3. Run the app pointed at it
DATABASE_URL=postgresql://postgres:test@localhost:5434/postgres pnpm dev
# 4. Confirm login works and one student record loads end-to-end.
```

Write down: time-to-restore, last-known-good-data lag. Both are your real RPO/RTO numbers, not the ones in a doc.

### 4.6 Secrets rotation

Quarterly cadence (per [docs/SETUP.md](./SETUP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)):

- `SESSION_SECRET`, `CSRF_SECRET`: rotate, accept old for 24h via dual-key support (code change required if not already).
- QPay / E-Barimt / OpenAI / SMS keys: rotate via each vendor's dashboard, paste into Railway, redeploy.

---

## 5. Pre-launch checklist

Before pointing real users at it:

- [ ] All env vars set per the matrix in §1.7
- [ ] `SESSION_SECRET` and `CSRF_SECRET` are real 64/32-byte hex, not the CI placeholders
- [ ] `TICKET_SIGNING_MODE=gcp-kms` and the KMS key is provisioned (ADR-0014)
- [ ] `LLM_VENDOR` ≠ `mock`, `OPENAI_API_KEY` populated, AI tutor refusal text exercised (CLAUDE.md #7)
- [ ] QPay sandbox swapped for prod merchant credentials
- [ ] E-Barimt sandbox swapped for prod
- [ ] Custom domain attached, Cloudflare proxy enabled, TLS Full (strict)
- [ ] Cookie `Domain=.mozateach.com; SameSite=Strict; Secure; HttpOnly` (CLAUDE.md #8)
- [ ] CORS `WEB_ORIGIN` matches custom domain
- [ ] `/health` returns 200 under load
- [ ] Sentry receiving events, wellbeing routes scrubbed
- [ ] Better Stack ingesting logs
- [ ] Uptime monitor green from 3+ regions
- [ ] Postgres backups verified by an actual restore
- [ ] R2 lifecycle rule for old content packs (e.g., 90-day expiry on `tmp/*`)
- [ ] WAF on, rate limits on `/auth/*` and webhook routes
- [ ] 3G + offline smoke test from a throttled browser (CLAUDE.md #2, #3)
- [ ] All UI verified in Mongolian Cyrillic (CLAUDE.md #1)

---

## 6. Common failure modes

| Symptom                                          | Cause                                                | Fix                                                                |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Build OOMs on Railway                            | Default builder runs out at 2 GB on pnpm + Next.js   | Service → Settings → **Builder memory: 4 GB**                      |
| `pgvector` not available                         | Default Postgres image lacks it                      | Switch to `pgvector/pgvector:pg16` Docker image                    |
| `ECONNREFUSED` on api start                      | `REDIS_URL` not wired                                | Verify `${{Redis.REDIS_URL}}` resolves                             |
| Cookies rejected in browser                      | Cross-origin between two `up.railway.app` subdomains | Buy a domain; share registrable parent                             |
| Migration runs twice                             | Pre-deploy + start command both running it           | Migrate only in pre-deploy                                         |
| Next.js build can't find `@studyteach/contracts` | Workspace package not built before web               | Build `contracts` first in the build command (already in §1.4/1.5) |

---

## 7. Suggested first-week ramp

1. **Night 1**: provision Railway + push a feature branch → confirm api boots and `/health` returns 200 on `*.up.railway.app`.
2. **Day 2**: same for web, fix the `WEB_ORIGIN` bootstrap dance.
3. **Day 3–5**: buy `mozateach.com` (or `.mn`), wire Cloudflare, flip cookies to `Strict + Domain=.mozateach.com`.
4. **Before any real user**: restore drill + 3G smoke test + Mongolian Cyrillic visual sweep.

---

## See also

- [DEPLOYMENT.md](./DEPLOYMENT.md) — release procedure, rollback policy, DR targets, surge-window blackouts
- [SETUP.md](./SETUP.md) — local development setup
- [SECURITY_PRIVACY.md](./SECURITY_PRIVACY.md) — secrets handling, PDP Law compliance
- [PRD.md](../PRD.md) — hosting decision rationale (§11.2)
