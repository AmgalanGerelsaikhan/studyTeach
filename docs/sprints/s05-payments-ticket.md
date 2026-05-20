# Sprint S05 — Payments + Ticket + Bulk Roster

**2026-08-10 → 08-23**

## Goal

A teacher uploads a roster, registers a delegation for an Olympiad, pays via QPay, receives an E-Barimt receipt, and each student's digital ticket is signed, cached offline, and renders without network. Idempotent end-to-end.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-017 · Teacher Bulk Roster | backend-architect | 1000-row CSV parse + dedupe + checksum + delegation register |
| E-019 · Payments — QPay + idempotent invoices | payments-integration | QPay sandbox happy path + idempotency under retry |
| E-020 · E-Barimt receipt sync | payments-integration | webhook → receipt attached + downloadable PDF |
| E-021 · Signed Digital Ticket + offline render | payments-integration | signed payload + offline render at "venue" |

## Ticket seed list

- `[E-017]` CSV / Excel parser (`papaparse` or similar).
- `[E-017]` National-ID checksum validator (MN format).
- `[E-017]` Dedup within school across uploads.
- `[E-017]` Row-level error chips in UI.
- `[E-017]` Bulk-register endpoint with idempotency key.
- `[E-019]` QPay sandbox SDK wrapper.
- `[E-019]` Migration: `invoices` with `signature_hash UNIQUE`.
- `[E-019]` Signature: `SHA256(school_id || students_sorted || olympiads_sorted || window_id)`.
- `[E-019]` Invoice creation endpoint; returns existing on duplicate signature.
- `[E-019]` QPay webhook handler (HMAC-verified, idempotent).
- `[E-019]` Frontend payment flow (redirect or in-app deep-link).
- `[E-020]` ebarimt.mn API wrapper.
- `[E-020]` On QPay confirmation → call E-Barimt → attach `ebarimt_id`.
- `[E-020]` Retry queue if E-Barimt 5xx.
- `[E-020]` PDF receipt generation.
- `[E-021]` HSM-backed signing key (use software key in dev; HSM in prod).
- `[E-021]` Sign QR payload on confirmation.
- `[E-021]` PWA caches signed payload + pre-rendered QR PNG in IndexedDB `tickets` store.
- `[E-021]` Ticket render offline E2E test.

## Sprint risks

- QPay sandbox uptime. **Mitigation:** ops escalation contact + recorded webhook payloads for offline test.
- HSM not provisioned for prod. **Mitigation:** software key in S05; provision HSM in S07.
- E-Barimt schema changes. **Mitigation:** lock to current sandbox; integration test pinned to a recorded response.

## Demo

- Teacher uploads 50-row roster (with 2 intentional errors).
- Fixes errors, registers 48 for an Olympiad.
- Pays via QPay sandbox.
- See E-Barimt receipt attach.
- Open one student's ticket on phone with airplane mode on — QR renders.

## Exit criteria

- ◯ Duplicate signature returns existing invoice.
- ◯ E-Barimt sync success on every QPay confirmation.
- ◯ Ticket renders offline.
- ◯ Roster idempotent (same CSV twice → same rows).
- ◯ All payment paths emit audit-log rows.
