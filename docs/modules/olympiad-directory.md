# Module: Olympiad Directory & Digital Ticket (PRD §4.3)

> Owner: `backend-architect` + `payments-integration` (ticket signing/issue) + `offline-pwa-engineer` (offline ticket render).

## Purpose

Unify the fragmented Mongolian Olympiad ecosystem into one directory, registration, practice engine, and signed digital ticket — with online-proctored variants for soum students.

## Scope

### Directory

- Filterable by subject, grade bracket, organizer, registration window, venue, fee, online vs. in-person.
- Subjects: Math, Physics, Chemistry, Biology, Informatics, Mongolian Language, English, History.
- Search bar with debounced query.
- List view with tabs (all / registered / saved), sort dropdown.

### Online Olympiad variants (NEW in v2.0.0)

Olympiad organizers can publish online-proctored variants; the platform marks them with `is_online = true` and removes travel cost as a barrier.

### Practice Engine

- Historical exam PDFs.
- Timed mock tests with instant score.

### Digital Ticket Locker

- Cryptographically signed QR-code admission ticket auto-generated on QPay payment confirmation.
- Payload: `{ student_name, registration_hash, venue, seat, exam_time, signed_qr }`.
- Cached offline; renders without network at the venue.

## Behavior

1. Student or teacher (on behalf of class) registers for an Olympiad.
2. Idempotent invoice created (signature in PRD §7.2).
3. QPay redirect or in-app deep link to payment.
4. QPay webhook → `payments-integration` confirms → ticket signed and issued.
5. PWA caches ticket; venue scans offline.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| `GET` | `/olympiads` | Filterable directory; cursor pagination |
| `GET` | `/olympiads/:id` | Detail (incl. practice papers, online flag) |
| `POST` | `/registrations` | Create registration (idempotent) |
| `GET` | `/registrations` | Caller's registrations |
| `GET` | `/registrations/:id/ticket` | Signed payload + QR PNG |
| `POST` | `/practice/sessions` | Start a practice mock |

## Data

- Reads: `olympiads`, `registrations`.
- Writes: `registrations`, `invoices` (via `payments-integration`).

## UI (per prototype)

- Directory: multi-filter sidebar (subject chips, grade, delivery method, region, registration window, fee ranges, online toggle).
- Olympiad cards: subject badge, title, organizer, date/time, venue/online, fee, registration status, seat count.
- Digital Ticket (mobile, 390×844): hero card with brass corner brackets, QR centered, exam date + venue + seat, offline indicator.

See `studyTeach (2)/olympiad.jsx` and `studyTeach (2)/student.jsx` → `DigitalTicket`.

## Tests

- Directory filter combinations.
- Idempotent registration: submit same payload twice → one row.
- Ticket signature verification with public key.
- Offline E2E: register online, disable network, render ticket from IndexedDB.
- Surge simulation: 50K concurrent registrations against one window.

## P0 acceptance

- [ ] All major Olympiad organizers' events ingested.
- [ ] Online-proctored variant supported.
- [ ] Digital ticket renders offline.
- [ ] Idempotent registration verified under surge.
- [ ] E-Barimt receipt attaches automatically.

## Equity targets

- Olympiad registration count by soum: 3× baseline by month 12 (PRD §10.2).
