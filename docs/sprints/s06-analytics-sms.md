# Sprint S06 — Teacher Analytics + SMS Gateway

**2026-08-18 → 08-31**

## Goal

A teacher sees a class-level mastery matrix and an 8-week mock-test trend. Parents on feature phones receive payment-confirmation SMS in Mongolian Cyrillic and can reply `СТАТУС` to query.

## Active epics

| Epic                                     | Owner             | Exit                                                     |
| ---------------------------------------- | ----------------- | -------------------------------------------------------- |
| E-018 · Teacher Analytics Matrix         | backend-architect | per-student × per-strand heat matrix + 8-week trend      |
| E-022 · SMS gateway + outbound templates | backend-architect | outbound templates ≤2 segments; ≥98% delivery on staging |
| E-023 · SMS inbound (STATUS / STOP)      | backend-architect | inbound STATUS/STOP routed; STOP recorded in audit log   |

## Ticket seed list

- `[E-018]` `/teacher/analytics?class_id=…&subject=…` returns matrix.
- `[E-018]` Color-coded matrix cell component (5 mastery levels).
- `[E-018]` Hover reveals last-3 mock scores.
- `[E-018]` 8-week trend chart with national-average dashed line.
- `[E-018]` Multi-tenant test: teacher cannot see other school's students.
- `[E-022]` Aggregator SDK wrapper (configurable: Mobicom / Unitel / G-Mobile).
- `[E-022]` SMS template loader (`mn-Cyrl/sms.json`).
- `[E-022]` UCS-2 segment counter; CI test ≤2 segments.
- `[E-022]` Outbound templates: registration-paid, registration-pending, mock-completion, olympiad-reminder-24h.
- `[E-022]` Delivery-status webhook handler.
- `[E-023]` Inbound webhook (`/webhooks/sms-inbound`) with IP allow-list + HMAC.
- `[E-023]` `СТАТУС` / `STATUS` query → child's most recent activity.
- `[E-023]` `ЗОГС` / `STOP` opt-out → audit log row.
- `[E-023]` Parent-link verification flow refresh (national-ID hash + school code).

## Sprint risks

- SMS aggregator volume agreement not yet signed. **Mitigation:** ops escalation; demo on sandbox.
- Feature-phone STATUS query needs to identify the user from phone number alone. **Mitigation:** phone number → encrypted lookup against verified parent-child links.

## Demo

- Teacher opens 11-A Physics matrix; identifies 2 students with "Танилцсан" mastery in "Эргэлт".
- Trigger payment confirmation → see SMS arrive on a feature phone (or sandbox UI).
- Reply `СТАТУС` from feature phone → see summary SMS back.
- Reply `ЗОГС` → audit log entry + no further SMS.

## Exit criteria

- ◯ Mastery matrix matches prototype layout.
- ◯ Multi-tenant isolation E2E on analytics.
- ◯ All outbound templates ≤2 UCS-2 segments.
- ◯ STATUS inbound returns valid summary.
- ◯ STOP inbound stops all future sends and is audited.
