import { z } from 'zod';

/**
 * Typed environment loader. Every env var the API touches goes through here.
 * Per CLAUDE.md hard constraint #11: env vars must be confirmed loaded inside
 * the running process. Bootstrap calls `loadEnv()` and any failure crashes the
 * process loudly — no silent fallbacks to a degraded mode.
 */
const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be >=32 chars'),
  CSRF_SECRET: z.string().min(16, 'CSRF_SECRET must be >=16 chars'),
  LLM_VENDOR: z.enum(['mock', 'openai', 'azure-openai', 'local']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  QPAY_SANDBOX_MERCHANT_ID: z.string().optional(),
  QPAY_SANDBOX_SECRET: z.string().optional(),
  EBARIMT_SANDBOX_URL: z.string().url().default('https://sandbox.ebarimt.mn'),
  EBARIMT_API_KEY: z.string().optional(),
  SMS_AGGREGATOR_URL: z.string().optional(),
  SMS_AGGREGATOR_KEY: z.string().optional(),
  SMS_INBOUND_SECRET: z
    .string()
    .min(16, 'SMS_INBOUND_SECRET must be ≥16 chars')
    .default('dev-sms-inbound-secret-please-rotate'),
  SURGE_ENABLED: z.enum(['true', 'false', 'force']).default('false'),
  SURGE_THRESHOLD_RPS: z.coerce.number().int().nonnegative().default(500),
  /** Avg consume time per surge token (ms). Tunes the ETA estimate. */
  SURGE_CONSUME_MS: z.coerce.number().int().positive().default(80),
  TICKET_SIGNING_MODE: z.enum(['dev', 'gcp-kms']).default('dev'),
  TICKET_SIGNING_DEV_KEY_PATH: z.string().default('keys/dev-ticket-private.jwk.json'),
  TICKET_SIGNING_DEV_PUBLIC_KEY_PATH: z.string().default('keys/dev-ticket-public.jwk.json'),
  GCP_KMS_KEY_NAME: z.string().optional(),
  QPAY_WEBHOOK_SECRET: z
    .string()
    .min(16, 'QPAY_WEBHOOK_SECRET must be ≥16 chars')
    .default('dev-qpay-webhook-secret-please-rotate'),
  // Cloudflare Stream — Teacher Academy lesson video (E-025). All optional:
  // in dev they are unset and the player degrades to the lesson transcript.
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_STREAM_API_TOKEN: z.string().optional(),
  CLOUDFLARE_STREAM_SIGNING_KEY_ID: z.string().optional(),
  CLOUDFLARE_STREAM_SIGNING_KEY_PEM: z.string().optional(),
  // Content pack signing (PRD §5.2). Mirrors TICKET_SIGNING — dev mode loads
  // an ed25519 JWK from disk; prod uses GCP KMS (post-P0). The public key is
  // shipped to the client via CONTENT_PACK_SIGNING_PUBKEY (in apps/web env).
  CONTENT_PACK_SIGNING_MODE: z.enum(['dev', 'gcp-kms']).default('dev'),
  CONTENT_PACK_SIGNING_DEV_KEY_PATH: z.string().default('keys/dev-content-pack-private.jwk.json'),
  CONTENT_PACK_SIGNING_DEV_PUBLIC_KEY_PATH: z
    .string()
    .default('keys/dev-content-pack-public.jwk.json'),
  CONTENT_PACK_ASSET_BASE_URL: z.string().url().default('http://localhost:4000/content-packs'),
});

export type Env = z.infer<typeof Schema>;

let loaded: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (loaded) return loaded;
  const parsed = Schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  loaded = parsed.data;
  return loaded;
}

/** Resets the cached env. Test-only. */
export function __resetEnvForTests(): void {
  loaded = undefined;
}
