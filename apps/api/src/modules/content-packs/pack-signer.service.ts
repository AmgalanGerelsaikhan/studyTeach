import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { importJWK, type JWK } from 'jose';
import { createHash, sign as cryptoSign } from 'node:crypto';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';

/**
 * Signs canonical content-pack manifests with ed25519 (PRD §5.2).
 *
 * - dev: key is loaded from disk at CONTENT_PACK_SIGNING_DEV_KEY_PATH.
 * - prod: gcp-kms mode (not implemented in this branch — throws on use).
 *
 * The signature covers the SHA-256 hash of the manifest JSON serialised in a
 * stable, sorted-key form. Clients verify by recomputing the hash and checking
 * the signature against CONTENT_PACK_SIGNING_PUBKEY shipped with the PWA.
 */
@Injectable()
export class PackSignerService implements OnModuleInit {
  private readonly log = new Logger(PackSignerService.name);
  // jose's importJWK returns a KeyLike that Node's crypto.sign accepts at
  // runtime, but it surfaces to TS as the DOM `CryptoKey` which our tsconfig
  // doesn't include. Hold it as `unknown` and cast at the sign site.
  private privateKey!: unknown;
  private kid!: string;

  constructor(@Inject(ENV) private readonly env: Env) {}

  async onModuleInit(): Promise<void> {
    if (this.env.CONTENT_PACK_SIGNING_MODE !== 'dev') {
      // gcp-kms wiring deferred — fail loudly if anyone tries to sign in prod
      // mode without the implementation. Keeps the trust boundary explicit.
      this.log.warn('CONTENT_PACK_SIGNING_MODE=gcp-kms not implemented; signing will fail');
      return;
    }
    const path = resolve(process.cwd(), this.env.CONTENT_PACK_SIGNING_DEV_KEY_PATH);
    const jwk = JSON.parse(readFileSync(path, 'utf8')) as JWK;
    if (!jwk.kid) throw new Error(`content pack signing key at ${path} has no kid`);
    this.privateKey = await importJWK(jwk, 'EdDSA');
    this.kid = jwk.kid;
    this.log.log(`Loaded dev content-pack signing key kid=${this.kid}`);
  }

  /**
   * Returns {sig, kid, sha256} for a canonical manifest. Sha256 is hex; sig
   * is base64. Callers persist all three so the client can verify without
   * re-canonicalising on the server.
   */
  async sign(canonicalManifestJson: string): Promise<{
    signature_b64: string;
    signing_kid: string;
    manifest_sha256: string;
  }> {
    if (this.env.CONTENT_PACK_SIGNING_MODE !== 'dev') {
      throw new Error('content pack signing in non-dev mode is not implemented');
    }
    const bytes = Buffer.from(canonicalManifestJson, 'utf8');
    // Use Node's crypto.sign directly — jose's CompactSign produces a JWS,
    // but for content packs we want a detached ed25519 signature over the raw
    // manifest bytes so the client doesn't need a JOSE parser to verify.
    // Cast through unknown — importJWK returns jose's KeyLike which Node's
    // crypto.sign also accepts at runtime, but the TS types disagree.
    const sig = cryptoSign(
      null,
      bytes,
      this.privateKey as unknown as Parameters<typeof cryptoSign>[2],
    );
    return {
      signature_b64: sig.toString('base64'),
      signing_kid: this.kid,
      manifest_sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  }
}

/** Canonical JSON: sorted keys, no extra whitespace. Stable across runs. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}
