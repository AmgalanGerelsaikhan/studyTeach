import type { ContentPackDescriptor, SignedContentPack } from '@studyteach/contracts';

/**
 * Client-side content pack utilities (PRD §5.2).
 *
 * The PWA fetches `/content-packs/latest`, compares `manifest_sha256` with what
 * it has cached, and if newer downloads the full manifest from `manifest_url`,
 * verifies the ed25519 signature with the bundled public key, then installs
 * assets into IndexedDB. The asset download + IDB integration is a follow-up;
 * this file handles the API + verify primitives.
 */

const ASSET_BASE = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';

/** GET /content-packs/latest — descriptor only (no asset list). */
export async function fetchLatestPackDescriptor(): Promise<ContentPackDescriptor | null> {
  const res = await fetch(`${ASSET_BASE}/content-packs/latest`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchLatestPackDescriptor: HTTP ${res.status}`);
  return (await res.json()) as ContentPackDescriptor;
}

/** GET /content-packs/:id/manifest — the signed manifest payload. */
export async function fetchPackManifest(packId: number): Promise<SignedContentPack> {
  const res = await fetch(`${ASSET_BASE}/content-packs/${packId}/manifest`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`fetchPackManifest: HTTP ${res.status}`);
  return (await res.json()) as SignedContentPack;
}

/**
 * Verifies a signed manifest with the bundled ed25519 public key.
 *
 * The public key JWK is pulled from `NEXT_PUBLIC_CONTENT_PACK_SIGNING_PUBKEY_JWK`
 * (set at build time). The signature was produced over the canonical-JSON form
 * of the manifest WITHOUT pack_id — see pack-signer.service.ts on the server.
 *
 * Returns true iff the signature is valid AND the key id matches. Wraps
 * SubtleCrypto so the caller doesn't have to thread through importKey.
 */
export async function verifySignedManifest(
  signed: SignedContentPack,
  publicJwk?: JsonWebKey,
): Promise<boolean> {
  const jwk =
    publicJwk ??
    (process.env.NEXT_PUBLIC_CONTENT_PACK_SIGNING_PUBKEY_JWK
      ? (JSON.parse(process.env.NEXT_PUBLIC_CONTENT_PACK_SIGNING_PUBKEY_JWK) as JsonWebKey)
      : null);
  if (!jwk) throw new Error('NEXT_PUBLIC_CONTENT_PACK_SIGNING_PUBKEY_JWK not set');
  if ((jwk as { kid?: string }).kid && (jwk as { kid?: string }).kid !== signed.signing_kid) {
    return false;
  }

  // Server signs the manifest with pack_id stripped. Reproduce that here.
  const seed: Record<string, unknown> = { ...signed.manifest };
  delete seed.pack_id;
  const canonical = canonicalize(seed);
  const sigBytes = base64ToBytes(signed.signature_b64);

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'Ed25519' }, false, ['verify']);
  return crypto.subtle.verify('Ed25519', key, sigBytes, new TextEncoder().encode(canonical));
}

/** Canonical JSON: sorted keys, no whitespace. Mirrors pack-signer.service.ts. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

function base64ToBytes(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i += 1) view[i] = bin.charCodeAt(i);
  return buf;
}
