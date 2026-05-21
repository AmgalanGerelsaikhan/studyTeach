/* eslint-disable no-undef */
// k6 injects __VU, __ITER, __ENV at runtime — they're not undefined in
// the k6 sandbox. ESLint rule disabled at file scope.

// S07 E-024 surge load test — 50K concurrent / 60 minutes against
// /payments/invoices. Run with `k6 run load/surge.js`.
//
// Acceptance per S07 plan R-4 + R-5:
//   * 50K concurrent users with 1 RPS each = 50K RPS sustained for 60 min
//   * every queued write must end as a real `invoices` row
//
// The signature_hash for each VU is deterministic per (vu, iteration) so
// retries collapse to a single invoice (idempotency anchor matches the
// PRD §7.2 formula and the InvoiceService.create UPSERT).
//
// Notes:
//   * In dev, set BASE_URL=http://localhost:4000 and reduce stages to a
//     handful of VUs to smoke-test the script itself.
//   * In CI, the full 50K target needs a remote runner (k6 Cloud or a beefy
//     worker pool). The script is portable; the test harness chooses scale.
//   * Zero-data-loss assertion lives in load/surge-verify.sql — run it
//     after the script completes to confirm
//     `SELECT COUNT(*) FROM invoices WHERE signature_hash IN (k6 hashes)`
//     equals the unique signature count k6 emitted.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import crypto from 'k6/crypto';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const ENABLE_SURGE = __ENV.ENABLE_SURGE || 'false';

// Pre-generate a pool of registration IDs the test will hammer. In a real
// staging run this would be seeded by a fixture loader before the test.
const registrationIds = new SharedArray('registrations', () =>
  Array.from({ length: 10000 }, (_, i) => i + 1),
);

export const options = {
  scenarios: {
    surge: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5000 }, // warmup
        { duration: '5m', target: 50000 }, // ramp to peak
        { duration: '60m', target: 50000 }, // hold peak (acceptance window)
        { duration: '2m', target: 0 }, // cooldown
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // Per R-5: every queued write must end as a real invoices row. The
    // script-side assertion is "no 5xx + every POST returns either 200 or
    // 202 with a token". DB-side verification is in surge-verify.sql.
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<2000'], // p95 <2s per L-2 (form submit)
    'checks{check:invoice-created-or-queued}': ['rate>0.99'],
  },
};

export default function surge() {
  // Deterministic signature per (vu, iter) — duplicates are intentional
  // across iterations to exercise the idempotency path.
  const vu = __VU;
  const iter = __ITER;
  const seed = `vu:${vu}|iter:${Math.floor(iter / 3)}`; // 3 collisions per slot
  const hash = crypto.sha256(seed, 'hex');
  // Pick a registration from the pool. Avoid the PRD §7.2 collision-by-
  // student concern by mapping the hash to one specific registration.
  const rid = registrationIds[parseInt(hash.slice(0, 6), 16) % registrationIds.length];

  const payload = JSON.stringify({
    registration_ids: [rid],
    idempotency_key: hash,
  });
  const res = http.post(`${BASE_URL}/payments/invoices`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: __ENV.SESSION_COOKIE || '',
    },
    tags: { name: 'create-invoice' },
  });

  check(res, {
    'invoice-created-or-queued': (r) => r.status === 200 || r.status === 202 || r.status === 201,
  });

  if (res.status === 202) {
    // Surge mode is on. Optionally poll the queue endpoint a few times to
    // measure tail latency; in the full run this would be its own scenario.
    if (ENABLE_SURGE === 'true') {
      const token = res.json('token');
      if (token) {
        for (let i = 0; i < 5; i++) {
          sleep(5);
          const q = http.get(`${BASE_URL}/queue-position/${token}`, {
            tags: { name: 'queue-position' },
          });
          if (q.status === 200 && q.json('fulfilled') === true) break;
        }
      }
    }
  }

  sleep(1); // 1 RPS per VU
}
