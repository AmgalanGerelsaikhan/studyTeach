# Sprint S02 — PWA Shell + Persona Chrome

**2026-06-23 → 07-06**

## Goal

PWA installs on iOS and Android, service worker is registered with the policies in `docs/OFFLINE_STRATEGY.md`, and each persona has its own chrome (top bar / sidebar) matching the prototype. A queued write replays on reconnect with idempotency.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-008 · PWA shell + service worker | offline-pwa-engineer | installable PWA; SW registered; manifest + icons |
| E-009 · IndexedDB stores + sync queue (start) | offline-pwa-engineer | `pending-writes` store + retry loop + idempotency-key generation |
| E-011 · Student persona chrome | frontend-architect | top bar + tabs + offline indicator |
| E-012 · Teacher persona chrome (dual mode) | frontend-architect | sidebar + mode toggle persisted per user |
| E-013 · Parent persona chrome (mobile-first) | frontend-architect | 390×844 mobile chrome + child-selector |

## Ticket seed list

- `[E-008]` Manifest + 192/512 icons (Soyombo flame on lacquer + cream variants).
- `[E-008]` Service worker registration + version bump strategy.
- `[E-008]` Static asset cache-first.
- `[E-008]` Stale-while-revalidate for `/api/olympiads`, `/api/study-abroad/*`, `/api/teacher-academy/*`.
- `[E-008]` Network-first with sync-queue fallback for `/api/registrations`, `/api/payments`, `/api/auth/*`.
- `[E-008]` Never-cache for `/api/wellbeing/*`.
- `[E-009]` IndexedDB v1 schema: `pending-writes`, `tickets`, `mock-tests`, `tutor-sessions`, `curriculum-cache`, `forms-draft`.
- `[E-009]` Sync queue producer (FIFO + UUIDv7 idempotency key).
- `[E-009]` Background sync consumer with exponential backoff.
- `[E-009]` "Queued" indicator hook for UI.
- `[E-011]` Student top bar (logo + tabs Нүүр/AI Багш/ЭЕШ/Олимпиад/Гадаад + offline pill + bell + avatar).
- `[E-012]` Teacher sidebar (mode toggle Сурагчид/Би өөрөө + nav).
- `[E-013]` Parent mobile frame + child selector + SMS preview slot.

## Sprint risks

- iOS PWA install path is fiddly. **Mitigation:** test on a real iPhone in week 1; document the "Add to Home Screen" flow.
- IndexedDB quota differences across browsers. **Mitigation:** soft-cap our usage at 200MB; warn user before hitting it.

## Demo

- Install PWA on iOS and Android. Show offline indicator flipping when network is throttled.
- Queue a write while offline, reconnect, see it replay.
- Show each persona's chrome.

## Exit criteria

- ◯ PWA installable on iOS Safari + Android Chrome.
- ◯ Sync queue replays a queued write within 30s of reconnect.
- ◯ Wellbeing endpoints never cached (verified in test).
- ◯ Three persona chromes render and route between top-level pages.
