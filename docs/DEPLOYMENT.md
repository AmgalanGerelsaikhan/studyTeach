# Deployment

> Infra topology, release procedure, environments. Owner: ops + `security-compliance` (for secrets) + `backend-architect` (for DB migrations).

## Environments

| Env       | Domain                | Purpose                     | Refresh cadence        |
| --------- | --------------------- | --------------------------- | ---------------------- |
| `local`   | localhost             | Engineer dev                | n/a                    |
| `ci`      | GitHub Actions        | Test runner                 | per push               |
| `staging` | staging.studyteach.mn | Pre-prod, sandbox externals | continuous from `main` |
| `prod`    | studyteach.mn         | Live                        | manual, gated          |

## Topology (prod)

```
Cloudflare CDN (static + DDoS mitigation)
    │
    ├── /api/* ─────► Railway (Singapore region) — NestJS instances behind ALB
    │                     │
    │                     ├── Postgres 16 (primary + read replica)
    │                     ├── Redis 7 (Streams + cache)
    │                     ├── BullMQ workers (background jobs)
    │                     └── HSM (ticket signing key)
    │
    └── /static/*, /, /app/* ──► Cloudflare Pages / R2 (Next.js static + ISR)
```

- API + DB + Redis co-located in Singapore for low latency to UB.
- Cloudflare for global edge cache of static assets and CDN.
- HSM for ticket-signing key (provisioned before prod cutover).

## Secrets

Managed via Railway environment + Cloudflare secrets. Never in committed env files.

| Secret                               | Rotation                                  |
| ------------------------------------ | ----------------------------------------- |
| `SESSION_SECRET` (64-byte hex)       | Quarterly                                 |
| `CSRF_SECRET` (32-byte hex)          | Quarterly                                 |
| `QPAY_MERCHANT_KEY`                  | Annual (or per QPay vendor policy)        |
| `EBARIMT_API_KEY`                    | Per ebarimt.mn policy                     |
| `LLM_VENDOR_KEY`                     | Quarterly or per vendor compromise notice |
| `SMS_AGGREGATOR_KEY`                 | Annual                                    |
| `CONTENT_PACK_SIGNING_KEY` (private) | HSM-stored; never extracted               |
| `TICKET_SIGNING_KEY` (private)       | HSM-stored; never extracted               |
| DB credentials                       | Auto-rotated by Railway every 90 days     |

Rotation playbook: [`runbook/secret-rotation.md`](./runbook/secret-rotation.md) (to be filed in W-D).

## Release procedure

### Staging (automatic)

On merge to `main`:

1. CI runs full suite.
2. If green, build container image with git SHA tag.
3. Push to registry.
4. Railway pulls the new image; runs migrations; rolls instances.
5. Smoke tests run against staging.
6. On smoke failure, auto-rollback to previous image.

### Production (manual, gated)

Cadence: weekly during P0 stabilization, then biweekly.

1. Release manager opens a release PR cutting from `main` to `release/vX.Y`.
2. Generate release notes from CHANGELOG.
3. Run pre-flight checklist (below).
4. Tag the release: `git tag v1.X.Y && git push --tags`.
5. CI builds prod image.
6. Operator triggers prod deploy in Railway (manual button).
7. Migrations run automatically; instances roll one at a time.
8. Watch dashboards for 60 minutes post-cutover.
9. Post-release announcement in #ops + email to Moza leadership.

### Pre-flight checklist (prod)

- [ ] CI green on the release SHA.
- [ ] Smoke tests green on staging for 24h.
- [ ] No active P0/P1 incidents.
- [ ] Migrations reviewed by `database-schema`.
- [ ] No surge window expected in the next 4 hours (PRD §5.2 — never deploy during Olympiad registration close).
- [ ] Rollback plan reviewed (last green image SHA noted).
- [ ] On-call notified.
- [ ] CHANGELOG updated.

## Migrations in prod

- Always reversible (or paired with a deprecation migration scheduled one release prior).
- Backwards-compatible by default: add column first, then deploy reading code, then deploy writing code, then drop column in a later release.
- Lock-time on tables >10M rows: <30s, or use `pg_repack` / online-DDL pattern.
- DESTRUCTIVE migrations (DROP COLUMN, DROP TABLE) ship in a separate "drop" migration scheduled one full release after the deprecation migration.

## Rollback

- Image rollback: redeploy previous image SHA. Takes ~2 minutes.
- Migration rollback: every migration has a `down` (or is additive); revert with `pnpm db:migrate:revert`.
- Data rollback: never. We replay forward. If data corruption occurred, restore from PITR snapshot (RPO <5 minutes).

## Disaster recovery

| Target | Value      |
| ------ | ---------- |
| RTO    | <1 hour    |
| RPO    | <5 minutes |

- Postgres: PITR enabled; daily snapshots; encrypted backups in a second region.
- Redis: ephemeral (cache + queue). On rebuild, replay sync queue from clients.
- Object storage (content packs, PDFs): cross-region replication.

Quarterly DR drill: restore from snapshot in a sandbox region and verify the platform comes up. See [`runbook/dr-drill.md`](./runbook/dr-drill.md).

## Surge-window deploys

**Do not deploy during a surge window.** A surge window is the final 24h of any Olympiad registration. Calendar is maintained in `ops/surge-calendar.json`; CI blocks prod deploys if the current time falls inside one (unless override flag is set with leadership approval).

## Maintenance windows

- Announced 7 days in advance via in-app banner + email + SMS to subscribed parents.
- Avoid Sundays evenings (peak student usage).
- Avoid first week of each month (mock-test bulk sign-up).

## Hosting region

Locked to **Railway Singapore** for P0 launch. Tradeoff:

- Pro: Latency to UB is ~80ms (acceptable per PRD §11.2 target <120ms).
- Pro: Mature managed Postgres + Redis offering.
- Con: Single-region; mitigated by daily PITR backups to second region.

Future: evaluate AWS Tokyo or local on-premise hosting at scale (P2+).

## Observability stack

- Logs: Pino → Railway → log aggregator (TBD: Loki, Datadog, or self-hosted).
- Metrics: Prometheus-compatible scrape.
- Traces: OpenTelemetry → Tempo or vendor.
- Dashboards: see [`MONITORING.md`](./MONITORING.md).

## CDN cache invalidation

On prod deploy:

1. Static assets bust via fingerprinted filenames (no invalidation needed).
2. Cached API responses (stale-while-revalidate) bust via cache tag purge.
3. Service worker version bump triggers client to refresh.

## Feature flags

Stored in `users.feature_flags JSONB`. Toggle per user or per cohort. Used to:

- Dark-launch a P1/P2 feature to a beta group.
- Kill-switch a broken feature without redeploy.

Flag changes are audited.

## Pricing & billing reconciliation (per release)

Operations reconciles QPay invoices vs. E-Barimt receipts vs. delivered tickets weekly. Discrepancies trigger investigation; see [`runbook/payments-reconciliation.md`](./runbook/payments-reconciliation.md).

## Cutover plan (P0 → prod)

A one-time procedure. See [`runbook/p0-cutover.md`](./runbook/p0-cutover.md). Highlights:

- Migrate beta-cohort data from staging to prod (with consent re-confirmation).
- Notify all beta users by SMS + in-app.
- Gradual traffic ramp: 10% → 50% → 100% over 48 hours.
- On-call 24/7 for 7 days post-cutover.
