# Incident Response

> Companion to [`RUNBOOK.md`](./RUNBOOK.md). This document is the meta-process; the Runbook contains the playbooks.

## Severity ladder

| Severity | Trigger | Page | Response time | Resolve target |
|---|---|---|---|---|
| **SEV-1** | Data exposure · payment loss · crisis-flag misuse · full outage · ticket signing key compromise | Yes, immediate | 5 minutes | <4 hours |
| **SEV-2** | Auth issue · surge queue jam · ≥10% error rate · degraded payments · SMS aggregator outage · LLM vendor outage | Yes | 15 minutes | <24 hours |
| **SEV-3** | Degraded performance · non-critical bug · isolated user issue | No | Next business day | <2 weeks |

## Roles during an active incident

| Role | Responsibility |
|---|---|
| **Incident Commander (IC)** | Decision-maker. Calls comms, scopes the problem, declares severity, ends the incident |
| **Operations Lead** | Drives mitigation. Coordinates engineers, runs the playbook |
| **Communications Lead** | Updates status page, in-app banner, sends user notifications, coordinates with Moza leadership |
| **Scribe** | Captures the timeline in #incident-active for later post-mortem |

For SEV-1 these are four different people. For SEV-2 the IC can also be the Ops Lead.

## Incident lifecycle

```
[detected]
   │
   ▼
[acknowledged]   ◄── on-call confirms paging within SLA
   │
   ▼
[triaged]        ◄── severity declared; IC named
   │
   ▼
[mitigated]      ◄── customer-visible impact stopped (rollback, kill-switch, etc.)
   │
   ▼
[resolved]       ◄── root cause addressed; system back to normal
   │
   ▼
[post-mortem]    ◄── within 7 days (SEV-1) or 14 days (SEV-2)
```

## Decision tree — first 5 minutes

1. **Who is affected?** A single user, a school, an aimag, everyone?
2. **Is data at risk?** If yes → SEV-1, page security-compliance.
3. **Is money at risk?** If yes → SEV-1 or SEV-2 depending on scale.
4. **Is the wellbeing path involved?** If yes → SEV-1, page clinical reviewer.
5. **Can we kill-switch?** Most features have a flag; use it.
6. **Can we roll back?** Last green image SHA is in the Railway dashboard.

When in doubt, escalate up, not down.

## Communication templates

### Status page (public)

```
[Investigating] {Date Time ULAT} — Бид {service} дээр асуудал илрүүлсэн ба
шинжилж байна. Сайжруулалт хийгдэх үед мэдэгдэх болно.

[Identified] {Date Time ULAT} — Шалтгаан тогтоогдсон: {brief}. Засварт орох.

[Monitoring] {Date Time ULAT} — Засвар хийгдсэн. Бид нөхцөл байдлыг
ажиглаж байна.

[Resolved] {Date Time ULAT} — Бүх үйлчилгээ хэвийн ажиллаж байна.
```

### In-app banner

For SEV-2 user-visible degradation. Mongolian Cyrillic primary, English secondary.

### SMS to affected parents

Used only when (a) the incident affects payment status or (b) we're announcing a fix. Approval required from Communications Lead before send.

### SEV-1 leadership notification (SMS + email)

Sent by Communications Lead to Moza leadership within 30 minutes of declaration. Includes: severity, scope, current mitigation, ETA to resolution.

## Post-mortem

Required for every SEV-1 (within 7 days) and SEV-2 (within 14 days). No-blame culture. Template:

```markdown
# Post-mortem: {incident-id} — {short title}

**Date of incident:** YYYY-MM-DD
**Severity:** SEV-{1,2,3}
**Duration:** {detection → resolution}
**Author:** {name}

## Summary

One paragraph describing what happened, what users saw, what was done.

## Timeline (ULAT)

- HH:MM — first signal
- HH:MM — paged
- HH:MM — IC named
- HH:MM — mitigation deployed
- HH:MM — resolved

## Root cause

Technical root cause.

## Contributing factors

Process, vendor, human factors that allowed the issue to occur.

## Impact

- Users affected: ~X.
- Data integrity: {intact / degraded / lost — detail}.
- Financial: {none / Y MNT refunded / Z invoices delayed}.
- Compliance: {none / PDP Law disclosure required / DPIA review needed}.

## What went well

Things to keep doing.

## What went poorly

Things to stop or change.

## Action items

| # | Item | Owner | Due | Status |
|---|---|---|---|---|
| 1 | Add regression test for ... | ... | YYYY-MM-DD | open |
| 2 | Update runbook section ... | ... | YYYY-MM-DD | open |
| 3 | ... | ... | ... | ... |

## Lessons

Free-form reflection. What's the systemic insight?
```

Template lives at [`runbook/post-mortem-template.md`](./runbook/post-mortem-template.md).

## Action items

- Tracked in the issue tracker with `incident:{id}` label.
- Reviewed monthly by ops + leadership.
- Stale action items (>60 days, not started) escalated.

## Drills

- **Quarterly tabletop:** scenario walkthrough; tests the comms flow.
- **Quarterly DR drill:** restore from backup in a sandbox region.
- **Semi-annual fire drill:** simulate a SEV-1 with the on-call rotation.

## Notification obligations

Per Mongolian Personal Data Protection Law (2021):

- Affected users notified within 24 hours of confirmed data exposure.
- Data protection authority notified within 72 hours.
- Notifications drafted by Communications Lead, reviewed by `security-compliance`, sent by Moza leadership.

## What is **not** an incident

- A single user with a UI bug → ticket, not incident.
- Slow CI → engineering issue, not user-facing.
- A failed third-party sandbox in dev → developer environment issue.
- A localization typo → file via i18n review process.

When in doubt, an over-declared SEV-3 is fine; an under-declared SEV-1 is not.

## On-call etiquette

- Acknowledge the page within SLA, even if just to say "I'm on it."
- If you can't take the page, hand to secondary immediately.
- Don't make changes alone for SEV-1 without an IC named.
- Sleep matters. After a long incident, secondary covers; the engineer who held the SEV-1 takes the next day off.
