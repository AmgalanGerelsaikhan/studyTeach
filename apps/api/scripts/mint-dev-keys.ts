/**
 * Idempotent dev signing-key generator.
 *
 * In dev, the ticket service (ES256/P-256) and the content-pack signer
 * (Ed25519) both load their key material from disk under apps/api/keys/.
 * Those files are gitignored — locally they're created once and left
 * alone; in CI they don't exist at all, which is the root cause of the
 * "ENOENT … dev-ticket-private.jwk.json" failures in the integration
 * suite.
 *
 * This script mints both keypairs if any of the four expected files is
 * missing. It is safe to re-run: existing files are left untouched.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { generateKeyPairSync } from 'node:crypto';

const KEYS_DIR = join(process.cwd(), 'keys');

interface KeyPlan {
  privPath: string;
  pubPath: string;
  kty: 'ec' | 'ed25519';
  curve: 'P-256' | 'Ed25519';
  kid: string;
  alg: 'ES256' | 'EdDSA';
}

const PLANS: KeyPlan[] = [
  {
    privPath: join(KEYS_DIR, 'dev-ticket-private.jwk.json'),
    pubPath: join(KEYS_DIR, 'dev-ticket-public.jwk.json'),
    kty: 'ec',
    curve: 'P-256',
    kid: 'dev-ticket-v1',
    alg: 'ES256',
  },
  {
    privPath: join(KEYS_DIR, 'dev-content-pack-private.jwk.json'),
    pubPath: join(KEYS_DIR, 'dev-content-pack-public.jwk.json'),
    kty: 'ed25519',
    curve: 'Ed25519',
    kid: 'dev-content-pack-v1',
    alg: 'EdDSA',
  },
];

function mint(plan: KeyPlan): 'created' | 'kept' {
  if (existsSync(plan.privPath) && existsSync(plan.pubPath)) return 'kept';

  mkdirSync(dirname(plan.privPath), { recursive: true });

  const { publicKey, privateKey } =
    plan.kty === 'ec'
      ? generateKeyPairSync('ec', { namedCurve: 'P-256' })
      : generateKeyPairSync('ed25519');

  const pubJwk = { ...publicKey.export({ format: 'jwk' }), kid: plan.kid, alg: plan.alg };
  const privJwk = { ...privateKey.export({ format: 'jwk' }), kid: plan.kid, alg: plan.alg };

  writeFileSync(plan.privPath, JSON.stringify(privJwk, null, 2) + '\n');
  writeFileSync(plan.pubPath, JSON.stringify(pubJwk, null, 2) + '\n');
  return 'created';
}

for (const plan of PLANS) {
  const state = mint(plan);
  console.warn(`[mint-dev-keys] ${plan.kid}: ${state}`);
}
