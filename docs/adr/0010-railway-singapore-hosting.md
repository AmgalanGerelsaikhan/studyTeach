# ADR-0010: Railway (Singapore region) for API hosting

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** backend-architect, ops, AIAA leadership
- **Affects:** API hosting, DB hosting, deploy pipeline

## Context

The platform serves Mongolia primarily. Hosting decisions trade off:

- Latency to Ulaanbaatar.
- Operational maturity (managed Postgres, Redis, deploy pipelines).
- Compliance with the future Mongolian data residency requirements (PRD §11.1 — MoE standard pending).
- Cost.
- Team familiarity.

Local on-premise hosting in UB would address residency directly but adds operational burden and limits redundancy.

## Decision

For P0: host the API on **Railway** in the **Singapore region**. Postgres and Redis managed by Railway in the same region. Cloudflare for global CDN and DDoS mitigation.

Confirm UB ↔ Singapore p95 latency is <120ms before locking in. Re-evaluate at P2 against:

- AWS Tokyo (latency may be lower).
- On-premise or local Mongolian provider (data residency).

## Consequences

### Positive

- Mature managed Postgres, Redis, deploy pipeline.
- Reasonable latency for UB users (~80ms typical).
- Cloudflare edge cache covers static asset distribution globally.
- Cost-effective for our P0 scale.

### Negative

- Single-region; mitigated by PITR backups to a second region (Frankfurt).
- Data residency not native to Mongolia — pending MoE standard, this may need to change.
- Railway is a smaller provider than AWS/GCP; operational support depends on their team.

### Neutral

- Migration path off Railway exists; we use Postgres + Redis + Docker images, all portable.

## Alternatives considered

### AWS Tokyo

- Pros: lower latency, broader services.
- Cons: more complex setup, higher cost at our scale, IAM overhead.
- Why rejected (for P0): operational complexity exceeds Railway for a small team.

### On-premise in UB

- Pros: data residency native.
- Cons: hardware procurement, power reliability (PRD addresses unstable power for clients, but a data center needs UPS), staff for ops.
- Why rejected (for P0): infeasible in our timeline; reconsider at P2 with AIAA partnership.

### Cloudflare Workers + D1

- Pros: edge-first, low latency globally.
- Cons: D1 too immature for our schema; Workers don't fit NestJS without significant rewrite.
- Why rejected: stack mismatch.

### Vercel

- Pros: tight Next.js integration.
- Cons: less control over Postgres + Redis location; pricing at scale unclear; vendor lock-in on serverless function semantics.
- Why rejected: prefer explicit infra control.

## References

- PRD §7.1, §11.2.
- `docs/DEPLOYMENT.md`.
- `docs/ARCHITECTURE.md`.
