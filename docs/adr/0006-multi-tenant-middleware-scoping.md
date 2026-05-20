# ADR-0006: Multi-tenant scoping at middleware (not row-level security)

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** security-compliance, database-schema, backend-architect
- **Affects:** `apps/api/src/middleware/`, every authenticated route

## Context

The platform is multi-tenant by school. Cross-tenant reads are forbidden except for PLATFORM_ADMIN (with audit log entry). We have two reasonable enforcement layers:

1. **Application middleware** scopes every query by `organization_code` from the session.
2. **Postgres Row-Level Security (RLS)** policies enforce the scope at the DB layer.

## Decision

Enforce multi-tenant scoping in **application middleware**. RLS is **not** used at v2.0.0.

The middleware:

- Resolves `organization_code` from the verified session cookie.
- Attaches a scoped context to the request.
- Every controller/service receives the scope via DI.
- Cross-tenant reads require an explicit PLATFORM_ADMIN guard + audit log row.

## Consequences

### Positive

- Single enforcement point; easy to audit.
- Migrations don't need to manage RLS policies in lockstep with code.
- Performance: no per-query RLS evaluation overhead.
- Easier debugging; no "why doesn't this row exist" mysteries.
- Easier read replicas (no RLS state on replicas).

### Negative

- A bug in middleware can break tenant isolation. We compensate with: (a) per-route E2E tests for each role, (b) audit-log monitoring for cross-tenant reads, (c) per-PR security review.
- Database tools (e.g., a direct psql session by a DBA) bypass middleware. We accept this; DBAs sign DPAs and access is audited.

### Neutral

- We can layer RLS on top later if the threat model changes (e.g., if direct DB access is provisioned to schools). Until then, simpler is better.

## Alternatives considered

### Postgres RLS at row level

- Pros: defense in depth; bypassing middleware can't bypass RLS.
- Cons: every migration manages policies; debugging is harder; PLATFORM_ADMIN bypass is awkward.
- Why rejected: complexity outweighs the marginal safety benefit at our threat level.

### Separate database per tenant

- Pros: physical isolation.
- Cons: thousands of databases (one per school) is operationally untenable.
- Why rejected: scale.

### Sharded by organization_code

- Pros: better surge isolation.
- Cons: cross-tenant analytics (equity metrics) becomes painful.
- Why rejected: P0 doesn't need it; reconsider at P2 if scale demands.

## References

- PRD §3 (RBAC), §8.1.
- `docs/SECURITY_PRIVACY.md`.
- `.claude/agents/security-compliance.md`.
