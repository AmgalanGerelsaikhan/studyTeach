# Architecture

> Companion to PRD §7. This doc operationalizes the PRD's stack into directories, boundaries, and request flows.

## Repository layout (target)

```
.
├── apps/
│   ├── web/                 # Next.js 14 (App Router) — PWA
│   │   ├── app/             # routes per persona (student, teacher, parent, admin, pathway)
│   │   ├── components/      # application components
│   │   ├── components/st/   # Ger Interior design-system components
│   │   ├── lib/
│   │   │   ├── api/         # typed fetchers (shape imported from contracts/)
│   │   │   ├── i18n/        # mn-Cyrl, mn-Latn, en
│   │   │   ├── sync/        # offline sync queue client
│   │   │   ├── idb/         # IndexedDB schema + helpers
│   │   │   └── content-pack # offline content-pack import/verify
│   │   ├── styles/          # tokens.css, motifs.css
│   │   └── sw.ts            # service worker
│   └── api/                 # NestJS
│       ├── src/
│       │   ├── modules/     # one per PRD §4.x (ai-tutor, egsh, olympiads, …)
│       │   ├── contracts/   # request/response types — imported by apps/web
│       │   ├── middleware/  # tenant-scope, audit, rate-limit
│       │   ├── guards/      # RolesGuard + per-role guards
│       │   ├── queues/      # BullMQ producers/consumers
│       │   └── lib/         # llm, rag, qpay, ebarimt, signing, crypto
│       ├── migrations/      # PostgreSQL DDL
│       └── test/fixtures/   # mn-language fixtures
├── docs/                    # this directory
├── studyTeach (2)/          # design prototype (read-only)
└── PRD.md
```

## Trust boundaries

```
                ┌──────────────┐
   Browser ──── │  PWA / SW    │ ─── HttpOnly cookie ────┐
                └──────────────┘                          │
                                                          ▼
   USSD / SMS gateway ───────────► Aggregator ───► [API Gateway]
                                                    │   • tenant scope middleware
                                                    │   • audit middleware
                                                    │   • rate limit
                                                    ▼
                                    ┌────────────────────────────┐
                                    │     NestJS modules         │
                                    │  (one per PRD §4.x)        │
                                    └────────────────────────────┘
                                       │              │            │
                                       ▼              ▼            ▼
                                   PostgreSQL 16   Redis 7      External
                                   (+ pgvector)   (Streams,     (QPay,
                                                   cache)       ebarimt,
                                                                LLM vendor,
                                                                SMS)
```

The trust boundary is the API Gateway. Everything inbound from a browser, SMS, or USSD passes through tenant scope + audit middleware before reaching a module.

## Module boundaries (NestJS)

One module per PRD §4.x feature. A module is responsible for: its endpoints, its services, its queue producers, its background workers. A module does **not**:

- Reach into another module's database tables. Use a published port (a service exposed via DI from the other module's index).
- Import another module's controllers. Controllers are the public surface for HTTP only.
- Define its own DB schema in isolation. Schema is owned by `database-schema` agent and lives in `apps/api/migrations/`.

## Data flow: write path (idempotent)

```
1. Client constructs the write + generates Idempotency-Key (UUIDv7).
2. Stores write in IndexedDB `pending-writes` store.
3. Service worker attempts POST.
4. NestJS gateway:
   a. Verifies session cookie.
   b. Resolves organization_code via session → applies tenant-scope middleware.
   c. Applies rate limiter.
   d. Routes to module controller.
5. Controller delegates to service.
6. Service:
   a. Computes domain-specific signature (e.g., invoice SHA256).
   b. SELECTs by signature; if found, returns existing row.
   c. INSERTs in a single transaction; emits audit-log row.
   d. For payment paths, pushes to Redis Stream consumer.
7. Response sent.
8. Client SW receives 2xx → removes from `pending-writes` → updates local cache.
```

## Data flow: read path

```
1. Browser RSC fetch from /api/<resource> with session cookie.
2. Gateway applies tenant-scope.
3. Module service queries Postgres (always scoped by organization_code).
4. Hot reads cached in Redis with key `{org}:{resource}:{id}` for ≤60s.
5. RSC streams HTML; PWA also stores response in IndexedDB cache.
```

## Surge mode (deadline windows)

Triggered automatically when:
- Olympiad registration window enters its final 24h, **and**
- Sustained RPS to `/payments/invoices` > threshold (configurable, default 200 RPS).

In surge:
- Registration writes are pushed to Redis Stream `registrations.surge`.
- A single consumer per shard reads the stream and writes serially.
- The client UI polls `/queue-position` and displays ETA.
- Reads remain unrestricted.

## AI layer (PRD §6)

```
[Tutor request] → Refusal classifier (in-process)
                    │
                    ├─ refusal → return canonical Mongolian refusal text
                    │
                    └─ accept → RAG (pgvector over curriculum chunks)
                                  │
                                  └─ LLM call with retrieved context
                                       │
                                       ├─ cite curriculum strand
                                       ├─ optionally generate practice from bank or LLM
                                       └─ update concept_mastery (BKT)
```

Cost controls and refusals: see `.claude/agents/ai-tutor-engineer.md`.

## Offline strategy (PRD §5.1, §5.4)

See [`OFFLINE_STRATEGY.md`](./OFFLINE_STRATEGY.md). Highlights:

- All writes go through the sync queue (even online).
- Tickets render entirely offline using cached signed QR payloads.
- Schools pull 500MB-1GB content packs monthly via USB / local Wi-Fi.

## Hosting & regions

- API: Railway Singapore region.
- Static assets + PWA shell: CDN (Cloudflare).
- Postgres + Redis: managed instances co-located with API.
- LLM vendor: per provider's nearest region; cache aggressively to absorb latency.

**Closed 2026-05-20** (D-5): Measured Mongolia → Singapore RTT **60.3–62.8 ms** (8 ICMP probes, 0% loss) — well under the <120 ms target. See [ADR-0010](./adr/0010-railway-singapore-hosting.md) for the probe data and [`phase-reports/P0_REPORT.md`](./phase-reports/P0_REPORT.md) for full decision table.

## Observability

- Logs: structured JSON via Pino. **No PII.** **No wellbeing free-text.** Ever.
- Metrics: Prometheus-compatible. Per-route latency, error rate, queue depth, surge state, AI Tutor token consumption.
- Traces: OpenTelemetry from gateway through Postgres. AI Tutor RAG retrieval is a span.
- Dashboards: equity metrics (PRD §10) refreshed nightly from Postgres.

## Non-functional targets (from PRD §8.4)

| Target | Value |
|---|---|
| p95 page load on 3G | <3s |
| p95 form submit on 3G | <2s |
| Uptime (excl. planned) | 99.9% |
| Deadline-window concurrency | ≥50,000 simultaneous |
| Offline functionality | Full read + queued writes ≥7 days |
| RTO | <1 hour |
| RPO | <5 minutes |
| Audit log retention | 7 years |
