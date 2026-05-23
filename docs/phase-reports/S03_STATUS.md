# S03 Runtime Status

> Evidence pack for the AI Tutor MVP. Mode: implement, commit per ticket, on `main`. Captured at **2026-05-21**.

## Sprint S03 (◯ → ●)

Sprint window: 2026-07-07 → 07-20 (planned). Actual: shipped on 2026-05-21 in one continuous session.

| Wave   | Tickets                                        | Headline                                                                            |
| ------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Wave A | T1 schema · T4 LLM vendor · T7 refusal catalog | Foundation — DB CHECK invariants + deterministic mock vendor + locked refusal bytes |
| Wave B | T2 seed · T3 ingest CLI · T5 RAG retrieval     | 24 G11 chunks (mn-Cyrl) ingested via HNSW; subject/grade/lang-scoped retrieval      |
| Wave C | T6 refusal classifier · T10 quota · service    | Full request lifecycle wired; ≥1 citation invariant enforced at schema + DB layers  |
| Wave D | T11 chat UI · T12 Cyrl/Latn · T13 practice     | Three-pane chat shell live at `/ai-tutor`                                           |
| F-ups  | A login UI · B i18n parity · C mastery · D IDB | Demo path unblocked end-to-end; catalog parity gate locked                          |

## Epic scorecard delta

| Epic                                        | Before S03       | After S03                                                                                              |
| ------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| E-003 Auth + sessions + 2FA                 | ● (backend only) | ● + `/login` UI shipped, AuthStatus chip on student top bar (Follow-up A)                              |
| E-009 IndexedDB stores + sync queue         | ◐ (queue only)   | ◐ → ● for tutor-sessions store; `/api/ai-tutor/*` added to SW NEVER_CACHE                              |
| E-014 AI Tutor — RAG + refusals + BKT (mvp) | ◯                | ● **— all four Wave D criteria met; one launch-gate item (p95 first-token <2s on 3G) deferred to S04** |
| E-015 EGSh Prep                             | ◯                | ◯ (S04)                                                                                                |
| E-016 Olympiad Directory                    | ◯                | ◯ (S04)                                                                                                |

## What shipped this session (21 commits on `main`)

```
26bf843 feat(i18n): close tutor + auth catalog parity (L-8 partial)
102d80f feat(web): E-009/E-014 tutor sessions panel backed by IDB
7a554c4 feat(api+web): E-014 GET /me/mastery + tutor concepts panel
6678456 feat(web): E-003 login UI + persona-bar auth status chip
c3a88c9 feat(web): E-014 T11+T12+T13b three-pane chat UI
ab3888f feat(web): E-014 tutor API client + Latn↔Cyrl preview helper
9ea85b3 feat(api): E-014 T13a practice problem bank + GET /practice-problems
e32220c feat(api): E-014 AI Tutor module — session/turn/BKT/citation/controller
ec8a98b feat(api): E-014 T6 refusal classifier
8984ca9 feat(api): E-014 T10 quota guard service
4c7606a feat(contracts): E-014 tutor session + turn schemas
e4df28f chore(monorepo): emit contracts as CJS + isolate typecheck buildinfo
6fd2f72 feat(api): E-014 T5 RAG retrieval scoped by lang+grade+subject
f0001b0 feat(api): E-014 T2+T3 G11 seed corpus + ingest CLI
f7dab29 feat(db): E-014 T2 natural-key UNIQUE on curriculum_chunks
6df2ee0 feat(offline): never cache /api/ai-tutor/* in SW
c9e936c chore(ci): drop redundant pnpm version pin in action-setup
9bfbf64 chore(i18n): tidy mn-Latn home strings (typo + tagline trim)
76c6028 feat(api): E-014 T4 LLM vendor wrapper with mock + OpenAI stub
ca56112 feat(contracts): E-014 T7 canonical refusal catalog + getRefusalText helper
ea07d4a feat(ai-tutor): E-014 T1 schema for tutor sessions + curriculum chunks
```

## Sprint exit-criteria scorecard (`docs/sprints/s03-ai-tutor-mvp.md`)

| Criterion                                               | Status                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| All 4 refusal scenarios pass                            | ● — exam-mode + write-essay + blank-statement + non-academic all verified live; integration test covers all four                   |
| Every assistant turn has ≥1 citation                    | ● — enforced at DB CHECK (`assistant_turn_has_citation`), Zod (`AssistantTurn.citations.min(1)`), and live request output          |
| Quota ceiling enforced                                  | ● — 20/month free tier + Moza partner bypass; quota check fires BEFORE session-row INSERT so blocked students don't consume a slot |
| Mastery update visible                                  | ● — verified `0.30 → 0.37 → 0.43` per turn on Механик / Цахилгаан соронзон strands via live `GET /me/mastery`                      |
| p95 first-token latency <2s on 3G (with vendor caching) | ◯ — needs SSE + 3G profile in CI (both S04); current path collects then returns JSON                                               |

## End-to-end smoke (16 scenarios, all green)

Captured 2026-05-21. API on :4000 (built via `pnpm build`), web dev on :3000. Login cookie obtained via `POST /auth/login`.

| #   | Scenario                                               | Expected                                                        | Actual                                                                                   |
| --- | ------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | `pnpm db:migrate`                                      | migrations 0004 + 0005 + 0006 applied                           | up: `add-ai-tutor`, `curriculum-chunks-unique`, `practice-problems-unique` ✓             |
| 2   | `pnpm --filter @studyteach/api ingest:curriculum`      | 24 chunks upserted, 8/8/8 per subject                           | `upserted 24 chunks · by subject: math=8, mongolian=8, physics=8` ✓                      |
| 3   | Re-run ingest                                          | row counts unchanged                                            | Still 8/8/8 — idempotent ✓                                                               |
| 4   | `pnpm --filter @studyteach/api ingest:practice`        | 21 problems upserted                                            | `by subject: math=8, mongolian=7, physics=6` ✓                                           |
| 5   | `pnpm -r test`                                         | all suites green                                                | **70 tests / 3 workspaces / 0 fail** (5 contracts + 40 api + 25 web) ✓                   |
| 6   | `pnpm typecheck`                                       | clean                                                           | 3 workspaces done ✓                                                                      |
| 7   | `pnpm lint`                                            | zero warnings                                                   | `--max-warnings=0` clean ✓                                                               |
| 8   | API boot                                               | listening on :4000, all 13 routes mapped                        | `[NestApplication] successfully started`, AiTutor + Practice + MeMastery routes mapped ✓ |
| 9   | `POST /auth/login` (seed student, no 2FA)              | 201 + `Set-Cookie: st-sid=…; HttpOnly; SameSite=Strict`         | 201 + cookie set + `{user_id:1, primary_role:"STUDENT", organization_code:"UB-23"}` ✓    |
| 10  | `POST /ai-tutor/sessions` (no auth)                    | 401                                                             | 401 ✓                                                                                    |
| 11  | `POST /ai-tutor/sessions` (authed, idempotent)         | new session_id + replayed=false; same key → replayed=true       | First call: `replayed:false`; same key: `session_id` matches + `replayed:true` ✓         |
| 12  | `POST /ai-tutor/sessions/:id/turns` (physics question) | assistant role + ≥1 citation                                    | `{role:"assistant", citations:[3 БНХ refs], text:"Хариулт (mock): …"}` ✓                 |
| 13  | Same session with `in_active_mock_test=TRUE`           | refusal role + `ai-tutor.refusal.exam-mode`                     | Returns canonical Mongolian refusal text + key ✓                                         |
| 14  | `GET /me/mastery` after one turn                       | rows for cited strands; p_mastered = 0.37                       | `[{strand:"Механик", p_mastered:0.37, level:"INTRODUCED"}, …]` ✓                         |
| 15  | `GET /me/mastery` after a 2nd turn                     | p_mastered = 0.433 (BKT exposure rule)                          | `0.433` ✓                                                                                |
| 16  | `GET /me/mastery?strand_prefix=Цах`                    | 1 row, only Цахилгаан соронзон                                  | Single matching row ✓                                                                    |
| 17  | `GET /login`                                           | 200, h1 "Нэвтрэх" in mn-Cyrl                                    | 200, h1 + login-phone / login-password / login-submit testids present ✓                  |
| 18  | `GET /ai-tutor`                                        | 200, h2 "AI Багш", three-pane shell, subject buttons, Cyrl/Latn | 200, `tutor-shell` testid, all subject/grade buttons + script toggle visible ✓           |
| 19  | `POST /auth/logout`                                    | clears cookie, `{ok:true}`                                      | `{ok:true}` ✓                                                                            |

## Hard-constraint scorecard delta (CLAUDE.md)

| #   | Constraint                              | Before S03                | After S03                                                                                                                                                                                            |
| --- | --------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mongolian Cyrillic first                | ✓ home + persona chrome   | ✓ extended: tutor UI, refusal catalog, login form, mastery panel — all mn-Cyrl primary. **L-8 partial:** parity vitest gate now locks tutor + auth slices against drift                              |
| 2   | Offline-first PWA                       | ◐ foundation + sync queue | ◐ + tutor-sessions IDB persistence (Wave D); `/api/ai-tutor/*` added to SW NEVER_CACHE (stale transcripts would defeat constraint #7). 7-day E2E still pending (L-4)                                 |
| 3   | 3G baseline                             | Initial figures only      | Same. Tutor turn currently collects→JSON; SSE + CI 3G profile (L-1/L-2) move into S04                                                                                                                |
| 4   | Multi-tenant scoping at middleware      | ✓                         | ✓ unchanged. Tutor service additionally enforces per-student session isolation (cross-student session access returns 404)                                                                            |
| 5   | Idempotent QPay invoices                | Deferred (E-019/S05)      | Same                                                                                                                                                                                                 |
| 6   | Wellbeing data sacrosanct               | Anchored via SW           | Same. `wellbeing` regex still active alongside the new `/api/ai-tutor/*` rule                                                                                                                        |
| 7   | AI Tutor refusals                       | Catalog only              | **● Fully wired.** 4 canonical keys × 3 locales; exam-mode hard-locks regardless of input; in-process classifier with conservative regex (false positives are worse than false negatives)            |
| 8   | HttpOnly+SameSite=Strict+Secure cookies | ✓                         | ✓ unchanged. Login flow + AuthStatus chip + apiFetch all use `credentials: 'include'`; no client-readable session material introduced                                                                |
| 9   | Ger Interior design system              | ✓                         | ✓ extended. Tutor chat surface uses only sanctioned `St*` atoms (StCard / StChip / StButton / StIcon / StProgress / StSoyomboFlame). Brass citation chips, ember refusal cards, moss practice badge. |
| 10  | Five roles                              | ✓                         | ✓ unchanged                                                                                                                                                                                          |
| 11  | Verify the render                       | ✓ enforced                | ✓ enforced. Every commit was preceded by `pnpm typecheck && pnpm lint && pnpm -r test`. Wave D additionally curl-verified every new route against the built API binary; mastery bumps observed live  |

## Verification toolchain hygiene (bonus fixes)

Two latent monorepo bugs surfaced during Wave C verification and were fixed in `e4df28f`:

1. **Contracts pkg unloadable by real Node.** `package.json#main` pointed at `./src/index.ts`; once the barrel started re-exporting from `./refusals` and `./ai-tutor`, Node ESM bombed on extensionless relative paths (vitest's resolver had been papering over it). Built to CJS; `main` now points at `./dist/index.js`. `types` stays on source for editor nav.
2. **API typecheck + build buildinfo collision.** `tsc --noEmit` (typecheck) and `tsc` (build via nest CLI) shared the same default tsbuildinfo, so typecheck would mark every file as "emitted" and the next build silently produced an empty `dist/`. Each script now writes its buildinfo to a distinct path.

## What did NOT ship in this session (still ◯)

- **SSE streaming** for tutor turns. Backend collects all tokens then returns JSON. Needs `@Sse` + RxJS Observable pipe, per-token DB writes, and a fetch-with-ReadableStream client. Scoped as its own S04 ticket. Without it: `p95 first-token <2s on 3G` cannot be measured, and the assistant bubble shows nothing for the full duration of the call.
- **Tutor transcript replay.** Clicking a past session in the sidebar re-enters the chat shell but does not refetch transcript history from the API (needs `GET /ai-tutor/sessions/:id/messages`). Sized for S04 alongside SSE.
- **Full BKT** with `p_slip`/`p_guess`/`p_transit`. Current "exposure bump" is monotonic until 0.75. Real BKT lands when EGSh probes feed correctness signals in S04 — same service surface (`BktService`).
- **Real LLM vendor.** `MockLlmVendor` produces deterministic Mongolian-prefixed placeholder text. `OpenAiLlmVendor` is a loud-failing stub. Blocked on ADR-0011 zero-retention contract + DPIA (R-5/R-6 — not engineering decisions).
- **L-8 full catalog parity.** Parity gate is live but only covers tutor + auth keys today. Egsh / olympiad / abroad / teacher / parent / system blocks still need their sweep before P0 freeze.
- **L-4 7-day offline E2E.** Foundation pieces (SW + IDB + queue) are in place; the full offline-soak test plan is still ◯.
- **WCAG 2.1 AA pass on the tutor chat surface (L-7).** Components use the design-system atoms which carry baseline a11y, but no audit has been run.

## Suggested next action

Begin S04 (EGSh + Olympiad directory). The tutor stack is the consumer that EGSh's mock-test grading will write through to BKT, so the order matters. SSE + transcript replay fold in here as E-014 carry-over.

## Repo state

```
21 commits this session (all on main).
Working tree clean. Branch: main, ahead of origin/main by 21.
70 / 70 tests green across 3 workspaces (5 + 40 + 25).
```
