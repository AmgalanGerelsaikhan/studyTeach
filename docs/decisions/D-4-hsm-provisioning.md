# D-4 · HSM provisioning for ticket signing — elaboration

> **Status: ● Resolved 2026-05-20.** User approved **Option A with GCP** (Google Cloud KMS, Singapore region). Decision recorded in [ADR-0014](../adr/0014-hsm-gcp-cloud-kms.md). Sub-decisions D-4b/c/d/e defaulted per recommendations in this document. This file is kept as the analysis-of-record; the ADR is the canonical decision.

## What signs what

The HSM protects exactly one key class in v2.0.0: **the Olympiad ticket signing key.**

When `payments-integration` confirms a QPay payment, it generates a JSON payload `{ student_name, registration_hash, venue, seat, exam_time }` and signs it. The resulting QR is cached offline by the PWA and rendered at the venue. The venue's scanner verifies the signature against the platform's **public** key — no network needed at the venue.

Properties:

- **Volume:** ~tens of thousands of signatures per Olympiad registration window. Tens per second at peak; zero between windows.
- **Latency:** signing happens once at confirmation, not on a user-facing path. p99 < 500ms is fine.
- **Compromise impact:** any leaked private key lets an attacker forge admission tickets for any future Olympiad until rotation. **High blast radius.**
- **Recovery:** rotation invalidates all unused tickets; re-issuance is manual and disruptive.

Other key classes already covered elsewhere:

- Session signing — handled by application secret (no HSM needed).
- PII encryption-at-rest — `pgcrypto` with key rotated by Railway; not HSM territory.
- Content-pack signing — separate key class; same HSM provider could host both, but they are distinct keys.

## Threat model summary

| Threat | Mitigation HSM provides |
|---|---|
| Application server compromised → attacker reads memory | Key never enters server memory; signing happens inside HSM |
| Stolen backup → attacker decrypts private key | Key material never leaves HSM; backups only export wrapped/sealed copies |
| Insider with DB access → reads key | Key isn't in DB |
| Malicious employee with cloud-console access → exports key | HSM access policies require multi-party approval for export; FIPS 140-2 Level 3 hardware prevents export entirely |

## Options

### Option A — Cloud KMS (Google Cloud KMS, AWS KMS, or Azure Key Vault) **[Recommended]**

The cloud provider stores the private key in their own FIPS 140-2 Level 3 HSMs. Our application calls a `sign(payload)` API; the key never enters our process.

- **Where the HSM lives:** Singapore region of the chosen provider, co-located with our Railway hosting.
- **Setup time:** hours.
- **Operational burden:** approximately none. Provider handles HA, backups, hardware.
- **Cost:** \~\$1/month per key + \$0.03 per 10K signing operations. **At our volume, <\$5/month.**
- **Data residency:** Singapore region. Acceptable for v2.0.0; re-evaluate if future MoE standard requires Mongolia-domestic.
- **Compliance:** providers maintain SOC 2, ISO 27001; FIPS 140-2 Level 3 attestation on the underlying HSM.
- **Vendor lock-in:** moderate. Migration to a different KMS requires re-signing all live tickets with the new key, but the key class is small and rotation is already part of the design.
- **Comparison of providers:**

  | | GCP Cloud KMS | AWS KMS | Azure Key Vault MHSM |
  |---|---|---|---|
  | Singapore region | ✅ | ✅ | ✅ |
  | Cost per key/mo | ~\$1 | ~\$1 | ~\$3.20 |
  | Cost per 10K ops | ~\$0.03 | ~\$0.03 | included |
  | FIPS 140-2 Level 3 | ✅ | ✅ (dedicated HSM mode) | ✅ |
  | Multi-party export approval | ✅ | ✅ | ✅ |
  | Native to Railway | no | no | no |

  **Recommendation within Option A: Google Cloud KMS.** Lowest cost, mature signing API, simplest IAM, Singapore region directly available. AWS KMS is a fine second choice. Azure is overkill for our volume.

### Option B — AWS CloudHSM or GCP Cloud HSM (dedicated HSM)

A whole HSM cluster dedicated to us. More isolation than shared KMS; full control over key material.

- **Setup time:** 1–2 days.
- **Operational burden:** moderate. We manage cluster size, credentials, backups.
- **Cost:** **~\$720–\$1,500/month per cluster**, regardless of usage.
- **Data residency:** Singapore region.
- **Compliance:** FIPS 140-2 Level 3, exclusive use.
- **Vendor lock-in:** moderate (proprietary client SDK).

**Verdict:** overkill for one key class at our volume. The \~\$10K/year cost is hard to justify given Option A meets the same threat-model requirements at <\$5/month.

### Option C — On-premise HSM (YubiHSM 2 or Thales)

A physical device plugged into a Mongolia-hosted server (or carried as a USB device at the Singapore Railway instance — not practical).

- **YubiHSM 2:** ~$650 one-time, plus a server to host it. FIPS 140-2 Level 3 PIV/PKCS#11.
- **Thales / Entrust enterprise HSM:** \$10K+ device, plus operating cost.
- **Setup time:** days to weeks (procurement + installation + initialization).
- **Operational burden:** **high.** We physically host hardware, manage power, HA, key ceremony, audited access logs.
- **Cost:** hardware once + ongoing hosting; for YubiHSM 2 in a Mongolia-hosted server, \~\$2K capex + \$50–\$200/month opex.
- **Data residency:** Mongolia — only option that puts the key inside Mongolia today.
- **Vendor lock-in:** low at the API (PKCS#11) but high operationally.

**Verdict:** only justified if data residency requires Mongolia-domestic key storage. For P0, the PDP Law (2021) does not mandate this. If the future MoE interoperability standard does, we can migrate to this option without rewriting the application (signing API is stable).

### Option D — Software-only key with strong management (no HSM)

Key sealed in a secrets manager (e.g., HashiCorp Vault Transit engine, AWS Secrets Manager, Railway Secrets). The application loads it into memory at startup and signs in-process.

- **Setup time:** hours.
- **Cost:** included with Railway / chosen secrets manager.
- **Compromise resistance:** any process-memory dump or container exfiltration exposes the key. **Lowest assurance level.**

**Verdict:** **unacceptable for the ticket signing key** given blast radius. May be acceptable for development environments only (the prototype uses a software key in `apps/api/test/fixtures/signing/`).

## Recommendation

**Option A — Google Cloud KMS (Singapore region)** for production. **Option D — software key** for development.

Rationale:

1. **Threat model satisfied.** FIPS 140-2 Level 3 HSM backing; key never enters our process.
2. **Cost-proportionate.** <\$5/month for our volume; no capex.
3. **Operationally simple.** No physical hardware, no on-call rotation for hardware failure, no cluster sizing.
4. **Singapore region** matches Railway hosting (ADR-0010).
5. **Reversible.** If data residency requires Mongolia-domestic at P1/P2, we migrate to Option C without rewriting application code — the signing-API abstraction in `apps/api/src/lib/signing/` already hides the implementation.

## What you (user) need to decide

| Sub-decision | Default if no answer |
|---|---|
| **D-4a.** Approve Option A (Google Cloud KMS) for production? | If not approved by S05 start (2026-08-04), block S05 sign-off. |
| **D-4b.** Which cloud provider — GCP / AWS / Azure? | Default GCP per recommendation above. |
| **D-4c.** Multi-party approval policy for key export? | Default: 2-person approval required (`security-compliance` + ops lead). |
| **D-4d.** Rotation cadence? | Default: annual + on suspected compromise. |
| **D-4e.** Backup key class (e.g., a second signing key as a fallback)? | Default: no — single key with rotation procedure. |

## Required follow-ups once decided

| Item | Owner | Due |
|---|---|---|
| Provision GCP project + Cloud KMS keyring in Singapore | Moza Ops + security-compliance | Before S05 (2026-08-04) |
| Create signing key with `EC_SIGN_P256_SHA256` algorithm | security-compliance | Before S05 |
| Grant minimal IAM role to Railway service account | security-compliance | Before S05 |
| `apps/api/src/lib/signing/gcp-kms.ts` — wraps `cloudKMS.asymmetricSign` | payments-integration | Sprint S05 |
| DPIA in `docs/compliance/dpia-gcp-kms.md` | security-compliance | Before S05 |
| Runbook: key rotation procedure | security-compliance + ops | Before S07 |
| Runbook: key compromise response | security-compliance + ops | Before S07 (incident playbook #8) |

## Alternative scenarios — when the recommendation changes

- **If MoE standard publishes and requires Mongolia-domestic key storage during P0** → switch to Option C (YubiHSM 2 in a Mongolia-hosted server). Roughly +2 weeks of engineering work and ~\$2K capex.
- **If we move off Railway to AWS** → switch to AWS KMS within Option A. No architectural change.
- **If volume scales 100×** (millions of tickets/day) → revisit Option B (dedicated HSM cluster) — at that point the per-operation pricing of KMS may flip the cost calculation. Highly unlikely for v2.0.0.

## Open question for you — RESOLVED 2026-05-20

1. ✅ **Approve Option A (GCP Cloud KMS, Singapore region) as the production approach?** — **Approved.**
2. ✅ **Confirm GCP as the chosen provider** — **Confirmed.**
3. ⚪ **Any concern about Singapore data residency for the signing key specifically?** — defaulted to "acceptable for v2.0.0; revisit on MoE standard publication." Override anytime by amending [ADR-0014](../adr/0014-hsm-gcp-cloud-kms.md).

Sub-decisions defaulted per recommendations:

- **D-4c** Export approval: 2-person (`security-compliance` + ops lead).
- **D-4d** Rotation cadence: annual + on suspected compromise.
- **D-4e** Backup key class: single key with rotation procedure.

See [ADR-0014](../adr/0014-hsm-gcp-cloud-kms.md) for the canonical decision and follow-up checklist.
