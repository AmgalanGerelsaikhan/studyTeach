# Sprint S01 — Auth + Design System

**2026-06-15 → 06-28**

## Goal

A user can sign up, verify a phone OTP, log in over HttpOnly cookie, and land on a persona-scoped route. Audit log captures every auth event. Design-system inventory is sufficient for persona chrome work in S02.

## Active epics

| Epic | Owner | Exit |
|---|---|---|
| E-003 · Auth + sessions + 2FA | security-compliance | login/logout/OTP/2FA tested; cookies HttpOnly+SameSite=Strict+Secure |
| E-004 · Multi-tenant scope middleware | security-compliance | every authenticated route filtered by `organization_code` |
| E-005 · Audit log infra | security-compliance | append-only trigger; partitioning; 1 row per sensitive action |
| E-006 · Design system port (continued) | ger-design-system | full `St*` inventory matches prototype |
| E-010 · RBAC role guards | security-compliance | 5 role guards exist; deny test passes |

## Ticket seed list

- `[E-003]` Argon2id password hashing.
- `[E-003]` OTP via SMS aggregator sandbox.
- `[E-003]` Session cookie issue + verify on every request.
- `[E-003]` 2FA enforcement for TEACHER / SCHOOL_ADMIN / PLATFORM_ADMIN.
- `[E-003]` `/me` endpoint returns identity + role + locale.
- `[E-004]` `tenant-scope.middleware.ts` resolves `organization_code` from session.
- `[E-004]` Cross-tenant read test (denies for non-PLATFORM_ADMIN; audits for PLATFORM_ADMIN).
- `[E-005]` Migration 0010: `audit_log` table + triggers + monthly partitions.
- `[E-005]` `audit.middleware.ts` wraps every authenticated request.
- `[E-005]` Test that UPDATE/DELETE on `audit_log` raises.
- `[E-006]` Complete `St` inventory: `StChip`, `StTab`, `StAvatar`, `StProgress`, `StDivider`, `StPhoneBezel`, `StPhoneScreen`, `StSubjectGlyph`, `StCornerBracket`, `StPatternBand`.
- `[E-006]` Storybook story per component.
- `[E-006]` Decoration toggle wired through `decoration` user setting.
- `[E-010]` Per-role guard + `RolesGuard` composing them.
- `[E-010]` Negative test per role per restricted route.

## Sprint risks

- SMS aggregator sandbox flakiness. **Mitigation:** stub at HTTP boundary in dev; nightly real-aggregator smoke test on staging.
- 2FA UX on feature phones (none in S01; just verify the contract).

## Demo

- Sign-up + OTP + 2FA login + dashboard land for STUDENT and TEACHER.
- Cross-tenant read attempt → 403 + audit log entry shown.
- Storybook walkthrough of `St` inventory.

## Exit criteria

- ◯ Login flow end-to-end for 5 fixture users across 3 roles.
- ◯ Audit log integrity test passes.
- ◯ `St` inventory matches `studyTeach (2)` prototype.
- ◯ Multi-tenant E2E test green for all roles.
