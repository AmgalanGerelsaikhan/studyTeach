# Module: Parent Portal + SMS Gateway (PRD §4.8)

> Reach the 5% of herder families with no device, and the larger group whose only device is a feature phone. Owner: `backend-architect` + `frontend-architect` + ops (USSD negotiation).

## Purpose

Visibility for parents — including parents on feature phones — into their child's upcoming Olympiads, mock-test trajectory, registration status, payment history, dormitory welfare, and (if also a teacher) Teacher Academy progress.

## Account model

- Parent account linked to one or more children via national-ID hash + school-code verification.
- Multi-language UI: Mongolian Cyrillic (default), Mongolian Latin transliteration, English.
- Parent can revoke any school's read access; propagates within 24h.

## Views

- Child's upcoming Olympiads.
- Mock-test trajectory.
- Registration status + payment history.
- Dormitory welfare (if boarding).
- Teacher Academy progress (if parent is also a teacher — rare).

## SMS fallback (P0)

Templates (≤2 segments Mongolian Cyrillic UCS-2):

- Registration status: paid / pending / failed.
- Mock test completion: one-line summary.
- Olympiad reminder 24h before exam.
- Crisis-flag acknowledgement (counselor → parent, if applicable).

Inbound:
- `СТАТУС` / `STATUS` → child's most recent activity summary.
- `ЗОГС` / `STOP` → opt-out (legally required).

## USSD (P1)

Negotiated with Mobicom / Unitel / G-Mobile. Menu structure (max 4 levels deep, max 6 options/level, max 18 Latin chars/label):

```
1. Хүүхдүүд → 1. {name} → 1. Олимпиад → 1. Удахгүй
                                       2. Бүртгэгдсэн
                                       3. Дууссан
                       → 2. Загвар шалгалт → 1. Сүүлийн оноо
                                            2. Долоо хоногийн зураглал
                       → 3. Дотуур байр
                       → 4. Төлбөр
2. Нэвтрэх
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/parent/links` | Request link (national-ID hash + school code) |
| `POST` | `/parent/links/:id/verify` | OTP verification |
| `GET` | `/parent/children` | Linked children |
| `GET` | `/parent/children/:id/summary` | Aggregated view |
| `POST` | `/parent/sms-subscribe` | Subscribe per child / per event type |
| `POST` | `/webhooks/sms-inbound` | Aggregator inbound (STATUS / STOP) |
| `POST` | `/ussd/menu` | USSD aggregator menu callback |

## Data

- Reads: `parent_child_links`, `students`, `registrations`, `mock_test_results`, `invoices`.
- Writes: `parent_child_links`, SMS subscription preferences.

## UI (per prototype)

- **Mobile-first** (390×844 frame): child-selector tabs at top, upcoming olympiad card with date countdown, SMS notification preview pinned at bottom, brass corner brackets on hero card.
- **Onboarding:** national-ID hash + school code, OTP via SMS.
- **Settings:** SMS subscription matrix (one toggle per event type per child).

See `studyTeach (2)/family.jsx` → `ParentPortal`.

## Tests

- Link verification: only succeeds with matching national-ID hash + school code.
- Revocation propagates within 24h (verify cache invalidation).
- SMS templates ≤2 segments UCS-2.
- STOP keyword removes subscription, logged in `audit_log`.
- USSD menu callable with mocked aggregator.

## P0 acceptance (SMS portion)

- [ ] Outbound SMS template set delivered.
- [ ] STATUS inbound query returns latest summary.
- [ ] STOP inbound opt-out works.
- [ ] SMS delivery success rate ≥98% on staging.

## P1 acceptance (full portal + USSD)

- [ ] Multi-child support.
- [ ] USSD menu live with at least one mobile operator.
- [ ] Revocation in 24h verified.
- [ ] All views localized.
