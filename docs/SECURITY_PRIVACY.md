# Security & Privacy

> Working reference for the security/compliance program. Operationalizes PRD §8. Owner: `security-compliance` agent.

## Trust boundary

The trust boundary is the NestJS API Gateway. Everything inbound — browser, SMS, USSD, webhook — passes through:

1. TLS 1.3 termination.
2. Cookie / signature verification.
3. CSRF check (state-changing requests).
4. Multi-tenant scope middleware.
5. Audit middleware.
6. Rate limiter.

Only then does the request reach a module controller.

## Sessions & authentication

- **Cookie:** `__Host-st-sid`, HttpOnly, SameSite=Strict, Secure, Path=/.
- **Lifetime:** 24h max; sliding refresh up to 7d total.
- **No bearer tokens exposed to the browser.** Ever.
- **No client-readable session state.** `document.cookie` for sessions is forbidden.
- **2FA mandatory** for TEACHER, SCHOOL_ADMIN, PLATFORM_ADMIN. SMS OTP via the same aggregator as parent notifications. Optional for STUDENT and PARENT.
- **Password storage:** Argon2id, memory cost 64MB, iterations 3, parallelism 4.

## RBAC matrix

| Action                      | STUDENT | TEACHER                    | PARENT            | SCHOOL_ADMIN                            | PLATFORM_ADMIN      |
| --------------------------- | ------- | -------------------------- | ----------------- | --------------------------------------- | ------------------- |
| AI Tutor session            | ✅      | ✅ (self)                  | —                 | —                                       | ✅                  |
| EGSh mock test              | ✅      | ✅ (self)                  | —                 | —                                       | —                   |
| Olympiad register self      | ✅      | ✅ (self)                  | —                 | —                                       | —                   |
| Bulk roster upload          | —       | ✅ (own school)            | —                 | ✅ (own school)                         | ✅                  |
| View student analytics      | —       | ✅ (own students)          | ✅ (own children) | ✅ (own school)                         | ✅                  |
| Read PSR                    | —       | ✅ (own students, audited) | ✅ (own children) | ✅ (own school, audited)                | ✅ (audited)        |
| Read wellbeing aggregate    | —       | —                          | —                 | ✅ (own school dorms)                   | ✅                  |
| De-anonymize crisis flag    | —       | —                          | —                 | ✅ (designated counselor only, audited) | ✅ (audited)        |
| Issue Teacher Academy badge | —       | —                          | —                 | —                                       | ✅                  |
| Cross-tenant read           | —       | —                          | —                 | —                                       | ✅ (always audited) |
| Edit audit log              | —       | —                          | —                 | —                                       | ❌ (no one)         |

## Multi-tenant scoping

Every request resolves `organization_code` from the session. Every query is filtered. Cross-tenant queries are forbidden except for PLATFORM_ADMIN — and even then must emit an `audit_log` row.

Enforced in `apps/api/src/middleware/tenant-scope.ts`. Tested via E2E that attempts cross-tenant read with each role and asserts 403.

## Idempotency

- QPay invoices: `signature_hash = SHA256(school_id || student_ids_sorted || olympiad_ids_sorted || registration_window_id)`. Repeated submissions return the existing invoice.
- Every state-changing endpoint accepts `Idempotency-Key: <UUIDv7>` header. Server hashes with scope and dedupes for 24h.

## Encryption

| Data                     | At rest                                                   | In transit                   |
| ------------------------ | --------------------------------------------------------- | ---------------------------- |
| Session cookies          | N/A (signed)                                              | TLS 1.3                      |
| `phone_number`, `email`  | `pgcrypto` AES-256                                        | TLS 1.3                      |
| `national_id_hash`       | Hashed (SHA-256); never plaintext                         | TLS 1.3                      |
| `password_hash`          | Argon2id                                                  | N/A                          |
| AI Tutor session content | Plaintext in DB, 90-day retention                         | TLS 1.3                      |
| Wellbeing `free_text`    | Plaintext but firewalled (counselor stored function only) | TLS 1.3                      |
| QR ticket payload        | Signed (HSM-backed key)                                   | TLS 1.3                      |
| Content packs            | Signed                                                    | Out-of-band (USB) or TLS 1.3 |

## CSRF

Double-submit token on every state-changing request:

- Token issued in a non-HttpOnly cookie (`__Host-st-csrf`).
- Same token sent in `X-CSRF-Token` header by the client.
- Server verifies they match.

Mutations without both fail with 403.

## Rate limits

| Family                          | Per IP               | Per user                   |
| ------------------------------- | -------------------- | -------------------------- |
| `/auth/*`                       | 5/min                | 20/hour                    |
| `/ai-tutor/sessions`            | 30/min               | Per monthly session budget |
| `/registrations`, `/payments/*` | 60/min (surge-aware) | 30/min                     |
| Everything else                 | 100/min              | 300/min                    |

## Audit log

- Append-only (`UPDATE`/`DELETE` blocked by trigger).
- Partitioned monthly.
- Retention 7 years.
- Logged actions include (non-exhaustive): login, logout, 2FA-challenge, registration create, payment status change, PSR read, cross-tenant read, crisis-flag de-anonymization, parent-link revocation, AI Tutor session start/end, password reset, role change.

Every log entry: `{ actor_user_id, action, target_type, target_id, metadata, created_at }`.

## Privacy (PRD §8.2 operationalized)

### Minors (<16)

- Linked to a parent/guardian via verified national-ID hash + school code.
- Parental revocation is a single button; propagates within 24h.
- AI Tutor, wellbeing, study-abroad coach all gated by parent linkage if user is <16.

### Wellbeing

- Crisis-phrase de-anonymization is the only path. Disclosed at consent. Audited.
- Wellbeing free-text is never logged outside `audit_log` and never trains AI models.

### AI Tutor sessions

- Retained 90 days for quality review.
- Auto-purged after 90 days.
- User can request immediate purge — propagates within 24h.

### Data export

- Any user can export their full data as JSON via `GET /me/export`.
- Includes: profile, registrations, payments, mock test history, AI Tutor sessions (if not yet purged), Teacher Academy progress, Olympiad participation.
- Excludes: aggregate cohort data, other users' data.

## Compliance program

| Requirement                                                                  | Status                                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Mongolian Personal Data Protection Law (2021) — data controller registration | Pre-launch (see `docs/compliance/ropa.md`)                  |
| Record of Processing Activities (ROPA)                                       | Maintained in `docs/compliance/ropa.md`                     |
| Data Protection Impact Assessment (DPIA) per third-party                     | One per integration: `docs/compliance/dpia-<vendor>.md`     |
| MoE data interoperability standard                                           | Schema designed ahead; mapping pending standard publication |
| WCAG 2.1 AA                                                                  | Target P1 launch                                            |

## Threat model (top 6)

| #   | Threat                                          | Mitigation                                                                       |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | National ID exfiltration                        | Hashed only; never plaintext; multi-tenant scope; encrypted PII at rest          |
| 2   | Duplicate Olympiad registration / double-charge | Idempotency signature on every invoice                                           |
| 3   | Crisis-flag misuse                              | Single audited de-anonymization path; counselor role; disclosed at consent       |
| 4   | Parent-portal cross-family access               | Linkage verified by hash + school code; revocation in 24h                        |
| 5   | Deadline-night DoS                              | Surge queue + per-IP/per-user rate limits + Redis Stream single-writer-per-shard |
| 6   | AI Tutor prompt injection                       | Refusal layer in front of LLM; classifier on inbound turns                       |

## Incident response

- **Severity 1** (data exposure, payment loss, crisis-flag misuse): page on-call within 5 minutes; user notification within 24h; post-mortem within 7d.
- **Severity 2** (auth issue, surge queue jam): on-call within 15 minutes; post-mortem within 14d.
- **Severity 3** (degraded performance, non-critical bug): next business day.

Playbooks live in `docs/incident-response/`.

## Pre-merge security checklist

For any PR touching auth, RBAC, audit, encryption, or PII handling:

- [ ] Diff reviewed against this document; doc updated if model changed.
- [ ] New endpoint has a tenant-scope test.
- [ ] New action emits an audit-log row.
- [ ] No PII or wellbeing free-text in logs.
- [ ] No third-party calls without a DPIA.
- [ ] No long-lived secrets in env files (all rotate via secret manager).
