# S00 + S01 Runtime Status

> Evidence pack for the 8 epics shipped this session. Mode: implement, commit per epic, on `main`. Captured at **2026-05-21**.

## Sprint S00 (◯ → ●)

| Epic                             | Commit    | Verification                                                                                                                      |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| E-001 Monorepo + tooling         | `d515093` | `pnpm typecheck` clean; `pnpm dev` runs; CI workflow committed                                                                    |
| E-002 Postgres + migrations      | `4746b3e` | Migration 0001 applied; 5 enums + `users` + `schools`; pgvector 0.8.2; seed inserts 3 schools + 5 users; idempotent               |
| E-006 Ger Interior design system | `156097d` | 13 `St*` components + 50-glyph `StIcon` + 8 `StSubjectGlyph` subjects; `pnpm dev` renders 30KB HTML with 8 SVG motifs             |
| E-007 i18n + mn-Cyrl baseline    | `d515093` | `next-intl` wired; 3 locales (`mn-Cyrl`, `mn-Latn`, `en`); cookie + Accept-Language resolution; `<html lang="mn-Cyrl">` on render |

## Sprint S01 (◯ → ●)

| Epic                                | Commit    | Verification                                                                                                                                                         |
| ----------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-005 Audit log infra               | `d6dcb49` | Migration 0002 applied; `audit_log` table + BEFORE UPDATE/DELETE triggers raise `audit_log is append-only`                                                           |
| E-003 Auth + sessions + 2FA         | `3148e8c` | Migration 0003 (sessions table + 2FA flag enabled for privileged roles); Argon2id (64MB/3/4); HttpOnly `st-sid` cookie; SMS OTP via Redis with 5-min TTL             |
| E-004 Multi-tenant scope middleware | `848c013` | `SessionMiddleware` + `TenantScopeMiddleware` on every route; `X-Cross-Tenant-Org` requires `PLATFORM_ADMIN`; all attempts (granted, denied, anonymous) audit-logged |
| E-010 RBAC role guards              | `e872e77` | `@Roles(...UserRole)` + `RolesGuard`; empty list = authenticated-only; deny emits `rbac.denied` audit row with required + actual                                     |

## End-to-end smoke (14 scenarios, all green)

Captured 2026-05-21. Docker `studyteach-postgres` + `studyteach-redis` healthy; `apps/api` listening :4000; `apps/web` (Next.js) listening :3000.

| #   | Scenario                                                     | Expected                  | Actual                                               |
| --- | ------------------------------------------------------------ | ------------------------- | ---------------------------------------------------- |
| 1   | `curl /` (web)                                               | mn-Cyrl render, real HTML | `<html lang="mn-Cyrl">`, "Сайн байна уу", "Фаз P0" ✓ |
| 2   | `GET /health`                                                | 200 + env loaded          | 200, `{status:ok, service:@studyteach/api}` ✓        |
| 3   | `POST /auth/login` (STUDENT, no 2FA)                         | 201 + cookie              | 201, `Me{user_id:1, role:STUDENT, org:UB-23}` ✓      |
| 4   | `GET /me` (student cookie)                                   | 200 + Me                  | 200 ✓                                                |
| 5   | `GET /me/scope`                                              | 200 + middleware context  | 200 ✓                                                |
| 6   | `GET /me/admin-ping` (STUDENT)                               | 403 (role guard)          | 403 "requires one of: PLATFORM_ADMIN" ✓              |
| 7   | `GET /me/scope` w/ X-Cross-Tenant-Org (STUDENT)              | 403 (tenant guard)        | 403 "cross-tenant requires PLATFORM_ADMIN" ✓         |
| 8   | `POST /auth/login` + `/auth/2fa/verify` (PLATFORM_ADMIN)     | 2FA flow → session        | challenge issued, OTP via Redis, session set ✓       |
| 9   | `GET /me/admin-ping` (PLATFORM_ADMIN)                        | 200                       | `{ok:true, admin:5}` ✓                               |
| 10  | `GET /me/scope` w/ X-Cross-Tenant-Org=KH-04 (PLATFORM_ADMIN) | 200, scope switched       | `{user_id:5, role:PLATFORM_ADMIN, org:KH-04}` ✓      |
| 11  | `POST /auth/logout`                                          | 200                       | `{ok:true}` ✓                                        |
| 12  | `GET /me` post-logout                                        | 401                       | 401 Unauthorized ✓                                   |
| 13  | `SELECT … FROM audit_log GROUP BY action`                    | full coverage             | 8 distinct actions, 25 rows total ✓                  |
| 14  | `DELETE FROM audit_log`                                      | trigger raises            | `audit_log is append-only` ✓                         |

## Audit log coverage (from final run)

| Action                      | Count |
| --------------------------- | ----- |
| `auth.login.success`        | 8     |
| `auth.login.2fa-challenge`  | 4     |
| `auth.login.2fa-verified`   | 4     |
| `auth.logout`               | 2     |
| `auth.login.failed`         | 1     |
| `rbac.denied`               | 2     |
| `tenant.cross_read.granted` | 2     |
| `tenant.cross_read.denied`  | 2     |

Every sensitive action routes through `AuditService.record(...)`. UPDATE/DELETE on `audit_log` raises at the DB layer.

## Hard-constraint scorecard (CLAUDE.md)

| #   | Constraint                                       | Status                                                                                                                                        |
| --- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mongolian Cyrillic first                         | ✓ `<html lang="mn-Cyrl">` on default render; `mn-Latn` + `en` are toggles                                                                     |
| 2   | Offline-first PWA                                | Service worker deferred to S02; **not yet satisfied**                                                                                         |
| 3   | 3G baseline (p95 page load <3s, form submit <2s) | Initial: 4.5s Next compile, ~13ms warm; budget enforcement deferred to S07                                                                    |
| 4   | Multi-tenant scoping at middleware               | ✓ `TenantScopeMiddleware` enforces; cross-tenant requires PLATFORM_ADMIN; all attempts audited                                                |
| 5   | Idempotent QPay invoices                         | Deferred to E-019 (S05)                                                                                                                       |
| 6   | Wellbeing data sacrosanct                        | Deferred to P2 (E-039 onward)                                                                                                                 |
| 7   | AI Tutor refusals                                | Deferred to E-014 (S03)                                                                                                                       |
| 8   | HttpOnly+SameSite=Strict+Secure cookies          | ✓ Cookie name `st-sid` (dev) / `__Host-st-sid` (prod); HttpOnly verified by curl jar flag; SameSite=Strict; Secure only in prod (dev relaxed) |
| 9   | Ger Interior design system                       | ✓ 13 `St*` components in production, 50-icon glyph set, no emoji in product UI                                                                |
| 10  | Five roles                                       | ✓ `STUDENT`, `TEACHER`, `PARENT`, `SCHOOL_ADMIN`, `PLATFORM_ADMIN` in enum + RBAC                                                             |
| 11  | Verify the render                                | ✓ Every commit ran `pnpm typecheck && pnpm lint && curl …` before merge                                                                       |

## Repo state

```
7 commits this session (all on main, local):

e872e77 feat(security): E-010 RBAC role guards (@Roles + RolesGuard)
848c013 feat(security): E-004 multi-tenant scope middleware + session context
3148e8c feat(auth): E-003 sessions + 2FA + cookies (Argon2id, SMS OTP)
d6dcb49 feat(audit): E-005 append-only audit_log with triggers + AuditService
156097d feat(design): E-006 Ger Interior design system port
4746b3e feat(db): E-002 Postgres migrations harness with users + schools
d515093 feat(scaffold): E-001 monorepo + E-007 i18n bootstrap
```

Plus 5 commits from earlier this session (Moza rename, date shift, D-1..D-4 ADRs, planning baseline).

## What did NOT ship in this session (still ◯)

- **Sprint S02 PWA shell + sync queue** (E-008, E-009, E-011, E-012, E-013) — next session.
- Service worker + offline E2E.
- AI Tutor (E-014), EGSh (E-015), Olympiad (E-016), Teacher Workspace (E-017, E-018), Payments (E-019..E-021), SMS (E-022, E-023), Surge mode (E-024).
- Full a11y axe-core CI integration (covered in S07).
- Real SMS aggregator (mock OTP only).
- HSM-backed key signing (deferred to S05/S07).

## Suggested next action

Run sprint S02 in a new session: PWA shell + service worker (E-008), IndexedDB stores + sync queue (E-009), persona chromes (E-011, E-012, E-013). This unlocks every offline-capable feature downstream.
