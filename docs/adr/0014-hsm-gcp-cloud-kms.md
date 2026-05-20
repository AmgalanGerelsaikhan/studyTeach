# ADR-0014: HSM for ticket signing — GCP Cloud KMS (Singapore region)

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** payments-integration, security-compliance, ops, user (D-4 resolved)
- **Affects:** `apps/api/src/lib/signing/`, deployment pipeline, runbook
- **Supersedes:** open decision D-4 in `FEATURE_DEVELOPMENT_PLAN.md`. Full options analysis in [`docs/decisions/D-4-hsm-provisioning.md`](../decisions/D-4-hsm-provisioning.md).

## Context

The Olympiad **ticket signing key** is the single highest-blast-radius secret in v2.0.0. It signs the QR payload `{ student_name, registration_hash, venue, seat, exam_time }` at QPay confirmation time. The PWA caches the signed payload offline; the venue verifies the signature against the platform's public key with no network. A leaked private key allows admission-ticket forgery for any future Olympiad until rotation.

Four options were considered in detail (cloud KMS, dedicated cloud HSM, on-premise HSM, software-only). Trade-offs documented in [`docs/decisions/D-4-hsm-provisioning.md`](../decisions/D-4-hsm-provisioning.md).

## Decision

For production: **Google Cloud KMS** with an asymmetric signing key (algorithm `EC_SIGN_P256_SHA256`) provisioned in the **Singapore region** (`asia-southeast1`).

For development: a software key kept under `apps/api/test/fixtures/signing/dev-key.pem` (never deployed; never used for any environment beyond `NODE_ENV=development`).

### Sub-decisions

| Sub | Decision | Rationale |
|---|---|---|
| **D-4a** Approve Option A (cloud KMS) | ✅ Approved by user 2026-05-20 | Threat model satisfied; cost-proportionate (<\$5/mo); reversible to Option C if MoE residency standard later mandates Mongolia-domestic |
| **D-4b** Provider | **Google Cloud KMS** | Lowest cost in Option A; mature signing API; Singapore region directly available; simpler IAM than alternatives |
| **D-4c** Export approval | **2-person** (`security-compliance` + ops lead) | Minimum viable separation-of-duties; documented in runbook |
| **D-4d** Rotation cadence | **Annual + on suspected compromise** | Industry baseline; tickets are bounded-lifetime (re-issuance possible) so rotation cost is acceptable |
| **D-4e** Backup key class | **None — single key with rotation procedure** | Two keys double the surface area; rotation procedure is sufficient |

## Consequences

### Positive

- FIPS 140-2 Level 3 HSM-backed key storage; the signing key never enters our process memory.
- <\$5/month at our expected signature volume; no capex.
- Singapore region co-located with Railway hosting (ADR-0010); negligible signing latency.
- Reversible — if the MoE interoperability standard or PDP Law amendment requires Mongolia-domestic key storage at P1/P2, we migrate to a YubiHSM 2 on a Mongolia-hosted server without changing the application; the signing API in `apps/api/src/lib/signing/` already hides the implementation.
- Cloud KMS audit logs feed our `audit_log` retention requirements.

### Negative

- GCP vendor dependency. Mitigation: signing-API abstraction hides the implementation; switching to AWS KMS / Azure Key Vault is a config change.
- Singapore region implies the signing key (and the events about it) crosses the Mongolia border. Acceptable for v2.0.0 per Mongolian PDP Law (2021); revisit on MoE standard publication.
- IAM misconfiguration can over-privilege the Railway service account. Mitigation: least-privilege IAM role (`roles/cloudkms.signerVerifier` only); reviewed by `security-compliance` before merge.

### Neutral

- We will operate one GCP project for this key class. Future key classes (content-pack signing, etc.) can use the same project + KMS keyring.

## Implementation

The signing path lives at `apps/api/src/lib/signing/gcp-kms.ts` and exposes a single function:

```ts
export async function signTicketPayload(payload: TicketPayload): Promise<SignedTicket>;
```

It calls `cloudKMS.asymmetricSign({ name: keyVersionName, digest: { sha256: digest } })`. The plaintext key never enters our process.

Public key for verification is exported once at deploy time and embedded in the PWA bundle so the venue scanner verifies signatures offline.

## Required follow-ups

| Item | Owner | Due |
|---|---|---|
| Provision GCP project + Cloud KMS keyring (`studyteach-prod` / `signing` / `asia-southeast1`) | AIAA Ops + security-compliance | Before S05 (2026-08-10) |
| Create signing key `ticket-signing-v1` with `EC_SIGN_P256_SHA256` | security-compliance | Before S05 |
| Grant Railway service account `roles/cloudkms.signerVerifier` on that key only | security-compliance | Before S05 |
| 2-person approval policy on `cloudkms.cryptoKeyVersions.import` and `.export` | security-compliance | Before S05 |
| `apps/api/src/lib/signing/gcp-kms.ts` — wraps `cloudKMS.asymmetricSign` | payments-integration | Sprint S05 |
| `apps/api/test/fixtures/signing/dev-key.pem` — software key for dev/CI | payments-integration | Sprint S05 |
| DPIA in `docs/compliance/dpia-gcp-kms.md` | security-compliance | Before S05 |
| Runbook: key-rotation procedure (`docs/runbook/key-rotation-ticket-signing.md`) | security-compliance + ops | Before S07 |
| Runbook: key-compromise response (extend RUNBOOK incident playbook #8) | security-compliance + ops | Before S07 |
| Verify CloudKMS audit log flow into platform audit-log retention pipeline | security-compliance | Before S07 |

## Alternatives considered

See [`docs/decisions/D-4-hsm-provisioning.md`](../decisions/D-4-hsm-provisioning.md) for the full four-option analysis. Summary of why others were not chosen:

- **Option B (dedicated cloud HSM):** \~\$10K/year for a one-key-class workload — not cost-proportionate.
- **Option C (on-premise HSM in Mongolia):** required only if data residency mandates it; PDP Law (2021) does not. Operationally heavy. Preserved as the migration target if MoE standard later requires it.
- **Option D (software key):** unacceptable blast radius for a key that signs admission tickets.

## References

- PRD §4.3 (Digital Ticket), §7.1 (stack), §8.1 (security).
- ADR-0008 (idempotency — invoice signature is a different signing path; not affected).
- ADR-0010 (Railway Singapore — co-location matches this decision).
- `docs/decisions/D-4-hsm-provisioning.md` — full options analysis.
- `.claude/agents/payments-integration.md`, `.claude/agents/security-compliance.md`.
- `FEATURE_DEVELOPMENT_PLAN.md` — D-4 now closed.
