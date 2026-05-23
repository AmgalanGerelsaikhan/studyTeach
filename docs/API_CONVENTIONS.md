# API Conventions

## Versioning

Header-based, not URL-based:

```
X-API-Version: v1
```

URL prefixes (`/v1/...`) are not used. This keeps client URLs stable across minor schema evolutions.

## URLs

- Plural, kebab-case resource paths: `/mock-tests`, `/teacher-academy/courses`, `/study-abroad/destinations`.
- Module-prefixed: `/auth/...`, `/payments/...`, `/ai-tutor/...`.
- Single-noun for synthetic resources: `/queue-position`, `/health`.

## Methods

| Method   | Use                                                                           |
| -------- | ----------------------------------------------------------------------------- |
| `GET`    | Read. Always idempotent.                                                      |
| `POST`   | Create. Requires `Idempotency-Key` header.                                    |
| `PATCH`  | Partial update. Requires `If-Match` header (ETag) for optimistic concurrency. |
| `PUT`    | Reserved for full-resource replace; rare.                                     |
| `DELETE` | Tombstone or revoke; never hard-delete user-visible records.                  |

## Authentication

Cookie-based. Session cookie:

- Name: `__Host-st-sid`
- `HttpOnly`, `SameSite=Strict`, `Secure`, `Path=/`
- Max-Age 24h, sliding refresh up to 7d total.

No bearer tokens in headers exposed to the browser.

## Multi-tenant scoping

Every request resolves `organization_code` from the session in `tenant-scope.middleware.ts`. Controllers receive a scoped context object; services use it implicitly. Cross-tenant queries are forbidden except for `PLATFORM_ADMIN`, which writes an `audit_log` row.

## Idempotency

Every state-changing endpoint (`POST`, `PATCH`, `DELETE`) accepts:

```
Idempotency-Key: <UUIDv7>
```

The server hashes this with the resource scope (`SHA256(idempotency_key + organization_code + endpoint)`) and stores it for 24h. Repeated submissions return the original response.

For invoice creation, the _domain_ signature in PRD §7.2 (`SHA256(school_id || student_ids_sorted || olympiad_ids_sorted || registration_window_id)`) is checked _in addition_ to the request-level Idempotency-Key. Either match returns the existing invoice.

## Pagination

Cursor-based:

```
GET /olympiads?cursor=eyJ...&limit=20
```

Response includes:

```json
{
  "items": [...],
  "next_cursor": "eyJ...",
  "has_more": true
}
```

Offset pagination is not used (breaks at scale and on surge).

## Errors

RFC 7807 Problem Details:

```
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://mozateach.mn/errors/duplicate-registration",
  "title": "Бүртгэл давхардлаа",
  "status": 409,
  "detail": "Энэ сурагч уг олимпиадад аль хэдийн бүртгэгдсэн байна.",
  "instance": "/registrations/4521",
  "extensions": {
    "existing_registration_id": 4521
  }
}
```

Notes:

- `title` and `detail` are in the requesting user's locale.
- `type` URL is stable; the document lives at the URL.
- Validation errors use `type: .../validation` with `extensions.errors` array.

## Rate limits

| Endpoint family                        | Limit                                            |
| -------------------------------------- | ------------------------------------------------ |
| `/auth/*`                              | 5 / IP / minute; 20 / user / hour                |
| `/ai-tutor/sessions`                   | Per the user's monthly session budget (PRD §4.1) |
| `/registrations`, `/payments/invoices` | Surge-aware (queue when threshold exceeded)      |
| Everything else                        | 100 / IP / minute                                |

Limits returned in `RateLimit-*` headers (RFC 9239 draft).

## Locales

- Server reads `Accept-Language` and falls back to user's `users.locale`.
- All user-facing error text in response bodies is in the resolved locale.
- Server logs in English (operational); user-facing strings localized at the response boundary.

## Contracts

Request/response types live in `apps/api/src/contracts/<module>.ts` and are **imported by the web app**. This avoids drift. Schema is defined with [`zod`](https://zod.dev) and produces both runtime validators and TypeScript types.

Example:

```ts
// apps/api/src/contracts/registrations.ts
export const CreateRegistrationInput = z.object({
  student_id: z.number().int().positive(),
  olympiad_id: z.number().int().positive(),
  idempotency_key: z.string().uuid(),
});

export const Registration = z.object({
  registration_id: z.number().int(),
  student_id: z.number().int(),
  olympiad_id: z.number().int(),
  signature_hash: z.string().length(64),
  payment_status: z.enum(['PENDING', 'PAID', 'EXPIRED', 'REFUNDED']),
  qr_payload: z.string().nullable(),
  created_at: z.string().datetime(),
});
```

## Webhooks (inbound)

| Source                                | Endpoint                     | Verification                                      |
| ------------------------------------- | ---------------------------- | ------------------------------------------------- |
| QPay                                  | `POST /webhooks/qpay`        | `X-QPay-Signature` HMAC-SHA256 with shared secret |
| ebarimt.mn                            | `POST /webhooks/ebarimt`     | `X-EBarimt-Signature`                             |
| SMS aggregator (inbound STATUS query) | `POST /webhooks/sms-inbound` | IP allow-list + HMAC                              |

Webhook handlers are idempotent — processing the same payload twice is safe.

## Health & ops

- `GET /health` — liveness, returns 200 if process is up.
- `GET /readiness` — checks Postgres + Redis + outbound to QPay + SMS aggregator; returns 503 if any is down.
- `GET /version` — git SHA + build timestamp.
