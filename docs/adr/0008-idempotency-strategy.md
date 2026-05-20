# ADR-0008: Idempotency-Key header + domain signature for payments

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** payments-integration, backend-architect, security-compliance, offline-pwa-engineer
- **Affects:** Every state-changing endpoint, especially payments

## Context

Two facts shape this decision:

1. The PWA is offline-first and replays queued writes. A queued write may post twice if the client doesn't yet know the first attempt succeeded.
2. Deadline-night surges (Olympiad registration close) drive many simultaneous duplicate-intent submissions from teachers under stress.

Both need idempotency without producing duplicate financial records.

## Decision

Two layers of idempotency on every state-changing endpoint:

### Layer 1 — request-level

Every `POST`/`PATCH`/`DELETE` accepts an `Idempotency-Key: <UUIDv7>` header. The server hashes it with the endpoint + organization scope and stores the response for 24 hours:

```
key = SHA256(idempotency_key + organization_code + endpoint)
```

Repeated submissions with the same key return the original response (status + body).

### Layer 2 — domain signature (payments only)

QPay invoice creation has an additional domain signature per PRD §7.2:

```
signature_hash = SHA256(school_id || student_ids_sorted || olympiad_ids_sorted || registration_window_id)
```

`invoices.signature_hash` is `UNIQUE`. INSERT with a duplicate signature returns the existing row.

**Either layer catching a duplicate is enough.** Both layers in place means the only way to get a duplicate is to bypass both — which the test suite asserts is impossible.

## Consequences

### Positive

- Offline client retries are safe.
- Surge-night duplicate submissions are safe.
- Audit log shows the original creator; subsequent attempts are visible as idempotent hits.
- Refunds and reconciliation are simpler — there's exactly one invoice per intent.

### Negative

- Every endpoint must implement the request-level layer; missing it is a security review failure.
- The 24-hour response cache eats some memory. We store in Redis with TTL.
- The signature inputs must be stable. If we ever add a column to the signature, we need a migration.

### Neutral

- The two layers are belt-and-suspenders. If we ever drop one, document and review.

## Alternatives considered

### Domain signature only (no request-level key)

- Pros: simpler.
- Cons: doesn't cover non-payment mutations (e.g., bulk roster upload).
- Why rejected: incomplete.

### Request-level key only (no domain signature)

- Pros: simpler.
- Cons: a different client with a different key could create a duplicate invoice if the user submits via web and SMS simultaneously.
- Why rejected: doesn't cover the multi-channel case.

### At-least-once with manual deduplication

- Pros: simpler server.
- Cons: pushes the problem to humans; this is unacceptable for payments.
- Why rejected: violates the "no double-charge" hard constraint.

## References

- PRD §5.2, §7.2, §8.1.
- `docs/OFFLINE_STRATEGY.md`.
- `docs/API_CONVENTIONS.md`.
- `.claude/agents/payments-integration.md`.
