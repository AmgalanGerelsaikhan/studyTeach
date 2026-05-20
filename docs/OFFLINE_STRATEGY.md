# Offline Strategy

> The platform must function for ≥7 days in a rural soum with intermittent power and no connectivity. This document is the working contract between the PWA, the sync queue, and the API. Owner: `offline-pwa-engineer`.

## Principles

1. **All writes go through the sync queue**, even when online. The queue is the single write path; the network is just transport. This eliminates two-code-path drift.
2. **Server is authoritative on conflict.** The client never auto-resolves; it surfaces server state and asks the user.
3. **Idempotency-Key on every write**, generated client-side (UUIDv7). Server hashes with scope and deduplicates.
4. **No silent data loss.** Every queued write either commits or surfaces a visible error.
5. **Tickets render entirely offline.** Most user-visible offline path; bugs here are P0.
6. **Wellbeing data is never cached.** Sensitivity overrides convenience.

## IndexedDB stores

| Store | Contents | Eviction |
|---|---|---|
| `pending-writes` | Sync queue (FIFO + idempotency key) | Never auto-evict; only on server-ack |
| `tickets` | Cached signed QR payloads + ticket metadata | Exam date + 30 days |
| `mock-tests` | Past EGSh papers + worked solutions | LRU when store >200MB |
| `tutor-sessions` | Last 7 days of AI Tutor exchanges | Hard expiry 7 days |
| `curriculum-cache` | Curriculum chunks user has opened | LRU when store >100MB |
| `forms-draft` | In-progress form state (bulk roster, mock test answers) | On submit-ack or after 30 days |

All access via the `idb` library; raw `IDBOpenDBRequest` is forbidden.

## Service worker policy

| Resource | Strategy |
|---|---|
| Static assets | Cache-first, versioned by SW build |
| Curriculum chunks already loaded | Cache-first |
| Ticket QR images | Cache-first |
| `/api/registrations`, `/api/payments`, `/api/auth/*` | Network-first with sync-queue fallback |
| `/api/olympiads`, `/api/study-abroad/*`, `/api/teacher-academy/courses` | Stale-while-revalidate |
| `/api/wellbeing/*` | **Never cache** |

## Sync queue lifecycle

```
client form submit
  → idempotency-key generated (UUIDv7)
  → stored in `pending-writes`
  → POST attempted immediately if online

on 2xx          → remove from queue; merge server response into local cache
on network err  → keep; SW background-sync retries with exponential backoff (max 12h between attempts)
on 409 conflict → surface server state; user decides
on 401/403      → pause queue; require re-auth; resume after re-auth
on 5xx          → retry per network-err policy with jitter
```

The UI must render a "queued" indicator on any record whose latest mutation is still in `pending-writes`.

## Surge interaction

In a registration surge window (PRD §5.2), the API returns `202 Accepted` with a `Location` header pointing at `/queue-position/<token>`. The PWA stores the token, polls every 30s while online, and surfaces queue position to the user. The write does not leave `pending-writes` until the queue position resolves to `PAID` / `PENDING` and a real `registration_id` exists.

## Content packs (PRD §5.1)

For schools, the platform produces signed monthly content packs (500MB-1GB) containing:

- AI Tutor curriculum content for the next month.
- Past EGSh papers.
- Olympiad directory snapshot.
- Latest Teacher Academy course videos.

Packs are:
- Generated server-side (`apps/api/src/modules/content-pack/`).
- Signed with the platform's content-pack key.
- Downloaded via USB stick from the AIAA office or pulled from the school's central computer over local Wi-Fi.
- The PWA verifies the signature before importing.

A pack import never overwrites pending user writes; it only fills caches.

## Ticket offline rendering

This is the highest-stakes offline path. Flow:

1. On registration confirmation, server signs the QR payload `{ student_name, registration_hash, venue, seat, exam_time }` with the HSM-backed key.
2. Server returns the signed payload + a pre-rendered QR PNG.
3. PWA stores both in the `tickets` store.
4. At the venue, the PWA renders the cached ticket. **No network required.**
5. The venue scanner verifies the signature locally (with the platform's public key).

No retry on this path. The ticket either renders or it doesn't.

## Re-auth handling

If the session expires while a write is in `pending-writes`:
1. SW receives 401.
2. Queue is paused; UI surfaces "сэргээж нэвтрэх" prompt.
3. After re-auth, queue resumes from the head.
4. Writes preserve their original Idempotency-Key — server dedupes if the original eventually reached it.

## Testing

- Every offline-capable flow has a Playwright test in `apps/web/e2e/offline/` that disables the network mid-write and re-enables it later.
- The test asserts the UI showed a "queued" indicator and that the write eventually persisted.
- Conflict resolution test: queue a write, change the server-side record (simulating concurrent edit), reconnect, verify the UI surfaces the server state.

## What this strategy does *not* do

- AI Tutor over a live LLM connection while offline. The PWA falls back to a cached "today's lesson" pack only.
- Cross-device conflict resolution beyond server-authoritative. Multi-device editing of the same form is not a v2.0.0 use case.
- Pushing changes to other connected clients. The PWA polls on reconnect; there is no WebSocket fan-out.
