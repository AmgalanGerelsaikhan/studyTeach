# S02 Runtime Status

> Evidence pack for the 5 epics shipped this session. Mode: implement, commit per epic, on `main`. Captured at **2026-05-21**.

## Sprint S02 (◯ → ●)

| Epic                                | Commit    | Verification                                                                                                                                                                  |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-008 PWA shell + service worker    | `3da0f3e` | Manifest 200, SW 200 w/ `Service-Worker-Allowed: /`, four SVG icons 200, `/offline.html` 200, `<link rel="manifest">` + `ServiceWorkerRegistrar` mounted in root layout       |
| E-009 IndexedDB stores + sync queue | `6d1a96d` | 13 vitest cases green (UUIDv7 shape/version/variant/sort/collision, queue enqueue, FIFO order, 2xx removal w/ Idempotency-Key, network retry, 401 pause + resume, 409 failed) |
| E-011 Student persona chrome        | `79ce441` | Five routes (`/`, `/ai-tutor`, `/egsh`, `/olympiad`, `/abroad`) each render with the top bar + exactly one `aria-current="page"` on the correct tab                           |
| E-012 Teacher persona chrome        | `ec42782` | `/teacher` → `aria-pressed=true` on `teacher-mode-institutional`; `/teacher/personal` → pressed on `teacher-mode-personal`; nav row `aria-current` flips accordingly          |
| E-013 Parent persona chrome         | `4eac26c` | `/parent` renders the 390-px mobile chrome, child selector with default Чимгээ pressed, grade card + SMS preview slot                                                         |

Plus `e00bc38` chore(branding): manifest `name` / `short_name` finished migration AIAA → Moza so install dialogs show the user-facing brand.

## End-to-end smoke (16 scenarios, all green)

Captured 2026-05-21. `apps/web` (Next.js dev) listening :3000. SW + manifest + offline fallback served from `public/`.

| #   | Scenario                                                | Expected                                         | Actual                                                                         |
| --- | ------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| 1   | `GET /manifest.webmanifest`                             | 200 `application/manifest+json`                  | 200, `Content-Type: application/manifest+json; charset=utf-8` ✓                |
| 2   | `GET /sw.js`                                            | 200 + `Service-Worker-Allowed: /` + `no-store`   | 200, `application/javascript`, `Cache-Control: no-store`, `Allowed: /` ✓       |
| 3   | `GET /icons/icon-192.svg` / `-512` / `maskable` / apple | 200 `image/svg+xml` each                         | 200 each (953 / 957 / 699 / 707 bytes) ✓                                       |
| 4   | `GET /offline.html`                                     | 200 (Mongolian Cyrl fallback)                    | 200, 2239 bytes ✓                                                              |
| 5   | `GET /` (student Нүүр)                                  | 200, `<html lang="mn-Cyrl">`, "Сайн байна уу" h1 | 200, h1 "Сайн байна уу", 1 active tab ✓                                        |
| 6   | `GET /ai-tutor`                                         | 200, h1 "AI Багш", active tab=AI Багш            | 200, h1 "AI Багш", 1 active tab ✓                                              |
| 7   | `GET /egsh`                                             | 200, h1 "ЭЕШ бэлтгэл"                            | 200, h1 "ЭЕШ бэлтгэл", 1 active tab ✓                                          |
| 8   | `GET /olympiad`                                         | 200, h1 "Олимпиадын каталог"                     | 200, h1 "Олимпиадын каталог", 1 active tab ✓                                   |
| 9   | `GET /abroad`                                           | 200, h1 "Гадаад сургалт"                         | 200, h1 "Гадаад сургалт", 1 active tab ✓                                       |
| 10  | `GET /teacher`                                          | 200, h1 "Багшийн ажлын талбар", mode=Сурагчдын   | 200, h1 "Багшийн ажлын талбар", `teacher-mode-institutional` `aria-pressed` ✓  |
| 11  | `GET /teacher/personal`                                 | 200, h1 "Би өөрөө · CPD", mode=Хувийн            | 200, h1 "Би өөрөө · CPD", `teacher-mode-personal` `aria-pressed` ✓             |
| 12  | `GET /parent`                                           | 200, h1 "Эцэг эх", chrome + selector + SMS slot  | 200, h1 "Эцэг эх", 4/4 testids present (chrome, home, selector, sms-preview) ✓ |
| 13  | Parent default child                                    | Чимгээ (ch-1) pressed                            | `aria-pressed="true" data-child-id="ch-1"` ✓                                   |
| 14  | `vitest run`                                            | UUIDv7 + queue suites green                      | 2 files, 13 tests passed in 548 ms ✓                                           |
| 15  | `pnpm typecheck` (3 workspaces)                         | All clean                                        | packages/contracts, apps/api, apps/web — all done ✓                            |
| 16  | `pnpm lint` (`eslint . --max-warnings=0`)               | Zero errors, zero warnings                       | Clean ✓                                                                        |

## Hard-constraint scorecard delta (CLAUDE.md)

| #   | Constraint                              | Before S02                       | After S02                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Mongolian Cyrillic first                | ✓ home only                      | ✓ extended: 5 student tabs + 2 teacher modes + parent mobile chrome, all mn-Cyrl by default                                                                                                                                                                                                            |
| 2   | Offline-first PWA                       | **Not satisfied** (S02 deferred) | ◐ **Foundation landed.** Installable manifest, SW with cache-first / SWR / network-first / never-cache (wellbeing) policies, `/offline.html` document fallback, IndexedDB v1 (6 stores), sync queue w/ UUIDv7 idempotency-key, exp backoff. Real-device install + ≥7d soak still on the roadmap (L-4). |
| 3   | 3G baseline                             | Initial figures only             | Same; SW now serves static + `/_next/static` cache-first, so warm 3G should drop further. Budget enforcement still S07.                                                                                                                                                                                |
| 4   | Multi-tenant scoping at middleware      | ✓                                | ✓ unchanged                                                                                                                                                                                                                                                                                            |
| 5   | Idempotent QPay invoices                | Deferred to E-019 (S05)          | Same. Note: client-side `Idempotency-Key` already wired by the sync queue — server-side dedup arrives with E-019.                                                                                                                                                                                      |
| 6   | Wellbeing data sacrosanct               | Deferred to P2                   | **Anchored:** SW explicitly never caches `/api/wellbeing/*` (regex guard); SMS preview content sample lives in i18n (not in `tutor-sessions` IDB).                                                                                                                                                     |
| 7   | AI Tutor refusals                       | Deferred to E-014                | Same.                                                                                                                                                                                                                                                                                                  |
| 8   | HttpOnly+SameSite=Strict+Secure cookies | ✓                                | ✓ unchanged; sync queue sends `credentials: 'include'` (cookies travel automatically, no client-readable token).                                                                                                                                                                                       |
| 9   | Ger Interior design system              | ✓                                | ✓ extended: persona chromes only consume sanctioned `St*` atoms; no emoji introduced.                                                                                                                                                                                                                  |
| 10  | Five roles                              | ✓                                | ✓ unchanged                                                                                                                                                                                                                                                                                            |
| 11  | Verify the render                       | ✓ enforced                       | ✓ continued: every commit was preceded by `pnpm typecheck && pnpm lint && curl …`.                                                                                                                                                                                                                     |

## Repo state

```
6 commits this session (all on main):

e00bc38 chore(branding): finish AIAA → Moza rename in PWA manifest
4eac26c feat(parent): E-013 parent persona chrome (mobile-first)
ec42782 feat(teacher): E-012 teacher persona chrome (dual mode)
79ce441 feat(student): E-011 student persona chrome (top bar + tabs)
6d1a96d feat(offline): E-009 IndexedDB stores + sync queue
3da0f3e feat(pwa): E-008 PWA shell + service worker
```

## What did NOT ship in this session (still ◯)

- Real-device PWA install evidence (Android Chrome + iOS Safari add-to-home-screen screenshots). Planned as part of S07 device-lab pass.
- Background-sync event registration (the SW exposes a `REPLAY_QUEUE` message hook for the client but doesn't yet subscribe via `sync.register`).
- Surge `202 + Location` polling shim in the queue — pending S05 / E-024.
- Wellbeing endpoints: enforced by _never-cache_, but the actual `/api/wellbeing/*` routes haven't shipped.
- E2E offline Playwright tests in `apps/web/e2e/offline/` — vitest unit coverage only this session.

## Suggested next action

Begin sprint S03 (AI Tutor MVP, E-014 + companion refusals). The persona chromes and the sync queue are the consumers AI Tutor will plug into; offline tutoring uses the `tutor-sessions` IDB store now in place.
