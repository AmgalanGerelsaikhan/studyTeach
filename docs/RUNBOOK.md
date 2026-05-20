# Runbook

> Operational playbooks for live production. Owner: on-call rotation. Detailed sub-playbooks live in [`runbook/`](./runbook/).

## On-call

- **Primary on-call:** rotates weekly. Pages within 5 minutes on P0/P1 alerts.
- **Secondary on-call:** backup; pages if primary unreachable for 10 minutes.
- **Escalation:** Moza ops lead, then Moza leadership.

Handoff: Mondays at 10:00 ULAT (UTC+8). Outgoing on-call writes a 5-line handoff in #ops.

## Severity definitions

| Severity | Definition | Response time | Examples |
|---|---|---|---|
| **SEV-1** | Data exposure, payment loss, crisis-flag misuse, full outage | 5 min page | DB exfil; QPay double-charge; ticket signing key compromise |
| **SEV-2** | Auth issue, surge queue jam, ≥10% error rate, degraded payments | 15 min page | Cross-tenant read leak (single user); E-Barimt sync stuck; deadline-night queue depth growing |
| **SEV-3** | Degraded performance, non-critical bug, isolated user issue | Next business day | Single screen slow; localized string missing |

## P0 incident playbooks

### 1. Suspected data exposure

1. **Stop the bleeding.** If active query path is identified, disable the route via feature flag.
2. **Lock the DB user**: rotate the credential that's being abused. Railway DB UI.
3. **Inform.** Page AIAA leadership + security-compliance lead.
4. **Investigate.** Pull audit log for the affected user/route over the past 7 days.
5. **Notify users.** Per Mongolian PDP Law (2021), affected users notified within 24 hours.
6. **Post-mortem within 7 days.**

### 2. Payment double-charge (idempotency failure)

1. Page `payments-integration` immediately.
2. Pull invoice with offending signature and check `audit_log` for source.
3. If a code path bypassed signature, hotfix branch + emergency deploy.
4. Refund affected charges via QPay reversal endpoint.
5. Notify affected users with refund SMS in Mongolian Cyrillic.
6. Update test suite to cover the regression before closing.

### 3. Surge queue jam

1. Check Redis Stream `registrations.surge` depth in Grafana.
2. Check consumer lag.
3. If consumer crashed, restart BullMQ worker.
4. If depth growing despite consumer running, scale up the worker count (max 16).
5. Communicate ETA to users via in-app banner + SMS to subscribed parents.
6. Post-incident: if queue >10K, file a capacity-plan epic.

### 4. AI Tutor refusal classifier failure

1. If classifier is returning non-refusals when it should refuse (e.g., during exam mode), **flip the kill-switch** flag `ai_tutor.global_disabled = true`.
2. Affected users see canonical "service temporarily unavailable" Mongolian message.
3. Page `ai-tutor-engineer`.
4. Roll back to previous classifier model from the model registry.
5. Re-enable.
6. Post-incident: refusal regression suite must catch the case before re-enabling.

### 5. Crisis-flag misuse alert

This is the most sensitive incident.

1. Page `security-compliance` + AIAA clinical reviewer + AIAA leadership.
2. **Do not view** the misused flag content. Just preserve audit-log evidence.
3. Lock the counselor account that performed the access.
4. Notify the affected student's school principal + AIAA ops within 24 hours.
5. Convene incident review with clinical reviewer, security-compliance, ops, and AIAA leadership.
6. Disclosure obligations per Mongolian PDP Law.

### 6. SMS aggregator outage

1. Detect via delivery-rate metric drop in Grafana.
2. Confirm with aggregator's status page or support line.
3. If sustained >30 minutes:
   - Queue outbound SMS internally (Redis Stream).
   - Switch primary to secondary aggregator if multi-vendor agreement live.
4. Communicate via in-app banner.
5. On recovery: drain queue with rate-limiting to avoid burst penalty.

### 7. LLM vendor outage

1. Detect via tutor request error rate.
2. Fall back to cached responses where possible (curriculum-strand cache).
3. If sustained: surface "AI Багш одоогоор боломжгүй" message; offer offline practice papers instead.
4. Switch vendor (if multi-vendor failover configured).
5. No data loss — sessions queued and resume when vendor restored.

### 8. Ticket signing key compromise

**Treat as SEV-1.**

1. Rotate the key in HSM (new key pair).
2. Invalidate all previously issued tickets that haven't been used yet.
3. Re-sign and re-distribute to affected users.
4. Communicate via in-app + SMS.
5. Investigate root cause; pen-test the signing service.

## Routine operations

### Daily checks (automated dashboard)

- p95 latency per route.
- Error rate per route.
- Sync queue depth.
- SMS delivery success.
- E-Barimt sync success.
- AI Tutor token consumption vs. budget.
- Active sessions count.

### Weekly

- Payments reconciliation (QPay ↔ E-Barimt ↔ tickets).
- Surge calendar review (next 30 days).
- Backup integrity check (random restore drill on a single table).
- Open SEV-3 backlog review.

### Monthly

- Content pack regeneration for offline schools.
- DR drill (restore staging from prod PITR).
- Audit-log retention check (purge entries older than 7 years).
- AI Tutor session purge (90-day expiry).
- Secret rotation reminders.

### Quarterly

- External a11y audit.
- Penetration test scope review.
- Backup region failover drill.
- Refusal regression corpus refresh.

### Annual

- Mongolian PDP Law compliance review.
- Pen test (external firm).
- Capacity plan refresh.
- Vendor contract renewals (QPay, ebarimt, SMS, LLM).

## Communication

| Channel | Use |
|---|---|
| `#ops` | Day-to-day operations; on-call handoff |
| `#incident-active` | Live incident; muted by default unless on-call |
| `#post-mortems` | Post-incident reviews; read by all |
| SMS to AIAA leadership | SEV-1 only |
| In-app banner | User-facing degradation notifications |
| `status.studyteach.mn` | Public status page |

## Post-mortems

Required for every SEV-1 (within 7 days) and SEV-2 (within 14 days). Template at [`runbook/post-mortem-template.md`](./runbook/post-mortem-template.md).

- Timeline of detection → mitigation → resolution.
- Root cause (technical).
- Contributing factors (process, human, vendor).
- What went well.
- Action items with owners and dates.
- **No blame.** Focus on systems, not individuals.

Action items tracked to completion. Stale action items reviewed monthly.

## Sub-playbooks (under [`runbook/`](./runbook/))

To be filed as P0 stabilizes:

- `runbook/secret-rotation.md`
- `runbook/dr-drill.md`
- `runbook/p0-cutover.md`
- `runbook/payments-reconciliation.md`
- `runbook/sms-aggregator-failover.md`
- `runbook/llm-vendor-failover.md`
- `runbook/post-mortem-template.md`
