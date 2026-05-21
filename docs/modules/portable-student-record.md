# Module: Portable Student Record (PSR) (PRD §4.9)

> P1 module. Academic record that follows a herder-family child across school transfers. Owner: `database-schema` + `backend-architect` + `security-compliance`.

## Purpose

When a herder family migrates and a child changes schools, the academic record should follow — without re-typing transcripts and without losing mastery progress.

## Scope

National-ID-keyed transcript stored centrally, encrypted at rest. Contains:

- Grades.
- Mock test history.
- Olympiad participation.
- Teacher Academy CPD (if user is also a teacher).
- Wellbeing flags — **counselor-access only.**

## Schema design

Keyed by `students.portable_record_uuid`. Aggregated nightly into a materialized view:

```
psr_<student_uuid>
  ├── identity (name + grade + school history)
  ├── grades (per term)
  ├── mock_tests (subject × score × percentile × date)
  ├── olympiad_history (registrations + outcomes)
  ├── teacher_cpd (if applicable)
  └── wellbeing_flags (counselor-only)
```

## Compliance

- Designed to comply with the future MoE national education data interoperability standard. The schema is intentionally aligned in advance so that mapping to the published standard is a transformation, not a re-write (PRD §11.1).
- Mongolian Personal Data Protection Law (2021) — full compliance.

## Privacy

- Student (if ≥16) or parent (if <16) can revoke any school's read access at any time.
- Revocation propagates within 24h.
- Every read emits an `audit_log` row with reader ID, timestamp, reason.

## Endpoints

| Method   | Path                                          | Notes                                        |
| -------- | --------------------------------------------- | -------------------------------------------- |
| `GET`    | `/psr/me`                                     | Student self-view                            |
| `GET`    | `/psr/:student_uuid`                          | School admin / teacher / counselor (audited) |
| `POST`   | `/psr/:student_uuid/access-grants`            | Owner grants a school access                 |
| `DELETE` | `/psr/:student_uuid/access-grants/:school_id` | Revoke (24h propagation)                     |
| `GET`    | `/psr/me/audit`                               | Owner sees who read their PSR and when       |

## Data

- Reads: `students`, `mock_test_results`, `registrations`, `teacher_certifications`, `risk_flags`.
- Writes: `psr_access_grants`, `audit_log`.

## UI

- **Owner view (student/parent):** clean transcript layout (felt cream surfaces, brass dividers between sections), revocation matrix per school, audit-log timeline.
- **Reader view (school admin/teacher):** read-only transcript; counselor sees additional wellbeing tab.

## Tests

- Audit-log row on every read.
- Revocation removes read access within 24h (cache invalidation verified).
- Wellbeing tab visible only to designated counselor.
- Multi-tenant: a school that hasn't been granted cannot read.

## P1 acceptance

- [ ] PSR populated for all P0 students.
- [ ] Owner can revoke and re-grant.
- [ ] Audit log shows every read with reason.
- [ ] Schema aligned with MoE standard (pending publication).

## Open dependency

- MoE data-sharing agreement — owner Moza Leadership (PRD §11.1). PSR ships without it, but inter-org PSR transfer is gated until the agreement is in place.
