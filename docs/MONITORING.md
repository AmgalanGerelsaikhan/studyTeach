# Monitoring & Observability

> Owner: ops. Defines metrics, logs, traces, dashboards, and alerts.

## Pillars

| Pillar  | Tool                   | What                                  |
| ------- | ---------------------- | ------------------------------------- |
| Logs    | Pino → log aggregator  | Structured JSON; no PII; no wellbeing |
| Metrics | Prometheus-compatible  | RED + USE + business KPIs             |
| Traces  | OpenTelemetry          | Request → DB → external               |
| Errors  | Sentry (or equivalent) | Exception tracking, source-mapped     |
| RUM     | Web vitals beacon      | LCP, FID, CLS per route per locale    |

## Logging policy

- **Structured JSON only.** No `console.log` in committed code.
- **No PII** in logs. Ever.
- **No wellbeing free-text** in logs. Ever.
- Every request log includes: `requestId`, `userId`, `organizationCode`, `route`, `method`, `status`, `latencyMs`.
- Log levels: `error` (user-visible failure), `warn` (degraded but functional), `info` (normal lifecycle), `debug` (dev only — stripped in prod).

## Metrics catalog

### RED (per route)

- `http_requests_total{route, method, status}` — rate
- `http_request_errors_total{route, method}` — errors
- `http_request_duration_seconds{route, method, quantile}` — duration (p50, p95, p99)

### USE (per resource)

- CPU utilization per service instance.
- Memory utilization per service instance.
- Postgres connection-pool saturation.
- Redis memory + ops/sec.
- BullMQ queue depth + worker count.

### Business KPIs

| Metric                                              | Reflects                                   |
| --------------------------------------------------- | ------------------------------------------ |
| `daily_active_users{aimag, role}`                   | Reach (PRD §10.1)                          |
| `mock_tests_completed_total{subject, grade, aimag}` | Learning engagement                        |
| `registrations_created_total{olympiad_id}`          | Olympiad reach                             |
| `tutor_sessions_total{subject, grade, aimag}`       | AI Tutor usage                             |
| `tutor_refusal_total{type}`                         | Refusal triggers (regression detection)    |
| `tutor_tokens_consumed_total`                       | LLM cost                                   |
| `payments_invoice_created{status}`                  | Payment funnel                             |
| `payments_ebarimt_sync_status{ok/failed}`           | Compliance health                          |
| `sms_delivery{status}`                              | SMS health (target ≥98%)                   |
| `sync_queue_depth`                                  | Offline-write health                       |
| `surge_mode_active{olympiad_id}`                    | Surge state                                |
| `crisis_flag_raised_total{school_id}`               | Wellbeing — aggregate only, no identifiers |

### Equity metrics (refreshed nightly)

Per PRD §10.2:

- `egsh_score_gap_ub_vs_provincial` — median delta.
- `olympiad_registrations_by_soum` — vs. baseline.
- `teacher_academy_completion_rate_by_aimag`.

Surfaced on the Moza leadership dashboard; reviewed quarterly.

## Tracing

OpenTelemetry from gateway through every span:

- HTTP request (gateway)
  - Auth middleware
  - Tenant scope middleware
  - Audit middleware
  - Controller
    - Service call
      - Postgres query (each)
      - Redis access
      - External (QPay, ebarimt, LLM vendor, SMS) — full URL + status + duration
    - Background job enqueue (BullMQ)
  - Response render

AI Tutor RAG retrieval is its own span. AI Tutor LLM call is its own span with `prompt_tokens` and `completion_tokens` attributes.

## Sampling

- Errors: 100%.
- Slow requests (>p95): 100%.
- Other requests: 5% of healthy traffic.
- Surge mode: 100% during active window.

## Dashboards (Grafana)

### Live operations

- p95 latency per route (last 1h, 24h).
- Error rate per route.
- Sync queue depth.
- Surge queue depth (when active).
- E-Barimt sync rate.
- SMS delivery rate.
- LLM token rate vs. budget.

### Deadline-night surge

- Active surge windows.
- Queue position distribution.
- Consumer throughput.
- Database write rate.
- Lock contention.

### Equity (Moza leadership)

- MAU by aimag.
- MAU share outside UB.
- Mock-EGSh score gap trend.
- Olympiad registrations by soum (vs. baseline).
- Teacher Academy completion by aimag.

### Wellbeing (counselors)

- Dorm-level mood/sleep/safety trends, no identifiers.
- Crisis-flag acknowledgement SLA (PRD §10.5: <24h).

## Alerts

| Alert                            | Condition                                                 | Severity | Routes to                        |
| -------------------------------- | --------------------------------------------------------- | -------- | -------------------------------- |
| `5xx_rate_high`                  | >1% over 5 min                                            | SEV-2    | On-call                          |
| `auth_failures_high`             | >5x baseline over 10 min                                  | SEV-2    | On-call + security               |
| `sync_queue_growing`             | depth grows for 30 min                                    | SEV-2    | On-call                          |
| `ebarimt_sync_below_99`          | success rate <99% over 1h                                 | SEV-2    | On-call                          |
| `sms_delivery_below_95`          | success rate <95% over 1h                                 | SEV-2    | On-call + ops                    |
| `tutor_refusal_unexpected`       | exam-mode refusal not triggering during proctored session | SEV-1    | On-call + `ai-tutor-engineer`    |
| `crisis_flag_path_anomaly`       | unexpected access pattern to wellbeing data               | SEV-1    | Security + leadership            |
| `payment_double_attempt`         | same signature_hash creates >1 invoice                    | SEV-1    | On-call + `payments-integration` |
| `psr_unauthorized_read`          | PSR read without an audit row                             | SEV-1    | Security + leadership            |
| `cross_tenant_read_unauthorized` | non-PLATFORM_ADMIN cross-tenant read                      | SEV-1    | Security + leadership            |
| `surge_consumer_lag`             | consumer lag >5K                                          | SEV-2    | On-call + `payments-integration` |
| `llm_vendor_error_rate_high`     | >5% over 10 min                                           | SEV-2    | On-call + `ai-tutor-engineer`    |
| `disk_usage_high`                | DB disk >85%                                              | SEV-2    | On-call                          |
| `audit_log_write_failure`        | any failure writing to audit_log                          | SEV-1    | Security + leadership            |

## SLOs

| Service                      | SLO                                  | Window         |
| ---------------------------- | ------------------------------------ | -------------- |
| Web availability             | 99.9%                                | 28-day rolling |
| API p95 latency              | <300ms (reads), <500ms (writes)      | 28-day rolling |
| Payment confirmation latency | <30s end-to-end (QPay→ticket issued) | 28-day rolling |
| SMS delivery                 | ≥98% within 5 min                    | 28-day rolling |
| E-Barimt sync                | ≥99.5% within 1 hour                 | 28-day rolling |
| Crisis-flag ack              | <24h                                 | rolling        |

Error budgets reviewed weekly. Burn >50% triggers a slow-down (no non-critical deploys).

## Audit log monitoring

The audit log is the single source of truth for who did what. Three streams of monitoring:

1. **Write failures** → SEV-1 alert (audit log must never fail silently).
2. **Anomaly detection** on access patterns (e.g., a counselor accessing more crisis flags than peers).
3. **Compliance reports** generated quarterly for Moza leadership.

## Real-User Monitoring (RUM)

Web vitals beacon per route:

- LCP, FID, CLS, INP per route per locale.
- Crash reports (window.onerror) per route.
- Service worker version distribution.
- Offline event count per session.

Sampled 10% in prod (full in staging).

## Data retention

| Stream              | Retention                                                    |
| ------------------- | ------------------------------------------------------------ |
| Application logs    | 30 days hot, 1 year cold                                     |
| Metrics             | 30 days hot, 1 year aggregated                               |
| Traces              | 7 days hot, 30 days sampled                                  |
| Audit log           | 7 years                                                      |
| Wellbeing free-text | Never logged outside audit; data itself retained per consent |
| AI Tutor sessions   | 90 days, then auto-purge                                     |
| RUM                 | 30 days                                                      |

## Privacy in observability

- Logs scrubbed of PII at the boundary (`requestId` always, `userId` integer always, `phone_number` / `email` / `national_id` never).
- Trace attributes sanitized — no query parameters, no body content.
- RUM does not capture form input.
- Wellbeing-related logs go to a separate, audited stream — never to the general log aggregator.
