import type { ContentPackDescriptor, SignedContentPack } from '@studyteach/contracts';

import { openDb, type ContentPackAssetRecord, type ContentPackRecord } from './db';

/**
 * Client-side content pack utilities (PRD §5.2).
 *
 * Closes the 7-day-offline loop: `installLatestPack()` fetches the latest
 * pack descriptor, compares its sha256 against what's cached, fetches the
 * full signed manifest if newer, verifies the ed25519 signature with the
 * bundled public key, downloads each asset, sha-verifies each, and writes
 * everything into IndexedDB (db.ts v2 stores).
 *
 * Consumer pages read offline content via `getCachedAssetBytes(kind, id)`.
 * The HTTP service worker (sw.js) is independent — content packs live in
 * IDB so they survive aggressive HTTP-cache eviction.
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

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Cache reads (used by consumer pages when offline) ───────────────────

/** Returns the installed pack descriptor, or null if nothing cached. */
export async function getCachedPackRecord(): Promise<ContentPackRecord | null> {
  const db = await openDb();
  const row = await db.get('content-pack', 'latest');
  return row ?? null;
}

/**
 * Returns the asset bytes for a (kind, source_row_id) pair if cached,
 * or null. Consumer pages should try the cache first when offline and
 * fall back to the network when online.
 */
export async function getCachedAssetBytes(
  kind: string,
  sourceRowId: number,
): Promise<ArrayBuffer | null> {
  const db = await openDb();
  const row = await db.getFromIndex('content-pack-assets', 'by-kind-source', [kind, sourceRowId]);
  return row?.bytes ?? null;
}

// ── Install / update ─────────────────────────────────────────────────────

export interface InstallResult {
  status: 'installed' | 'unchanged' | 'no-pack-available' | 'verify-failed' | 'network-error';
  /** Number of assets newly downloaded. */
  fetched?: number;
  /** Number of assets reused from a prior version (sha matched). */
  reused?: number;
  pack_id?: number;
  version?: number;
  error?: string;
}

/**
 * Idempotent install. Compares server's latest manifest_sha256 with the
 * cached one; if identical, returns 'unchanged' without re-downloading.
 * If different, verifies signature → downloads each asset → sha-verifies
 * each → atomically swaps the cache.
 *
 * Network errors are returned, not thrown — callers can show a soft
 * "offline" indicator instead of breaking the page.
 */
export async function installLatestPack(): Promise<InstallResult> {
  let descriptor: ContentPackDescriptor | null;
  try {
    descriptor = await fetchLatestPackDescriptor();
  } catch (err) {
    return { status: 'network-error', error: (err as Error).message };
  }
  if (!descriptor) return { status: 'no-pack-available' };

  const cached = await getCachedPackRecord();
  if (cached && cached.manifest_sha256 === descriptor.manifest_sha256) {
    return {
      status: 'unchanged',
      pack_id: cached.pack_id,
      version: cached.version,
      fetched: 0,
      reused: 0,
    };
  }

  let signed: SignedContentPack;
  try {
    signed = await fetchPackManifest(descriptor.pack_id);
  } catch (err) {
    return { status: 'network-error', error: (err as Error).message };
  }

  const ok = await verifySignedManifest(signed);
  if (!ok) return { status: 'verify-failed', error: 'manifest signature did not verify' };

  const db = await openDb();
  let fetched = 0;
  let reused = 0;

  for (const asset of signed.manifest.assets) {
    const existing = await db.get('content-pack-assets', asset.sha256);
    if (existing) {
      // Same bytes already cached — update pack_id pointer so we know which
      // pack version owns this asset for future garbage collection.
      if (existing.pack_id !== signed.manifest.pack_id) {
        await db.put('content-pack-assets', {
          ...existing,
          pack_id: signed.manifest.pack_id,
        });
      }
      reused += 1;
      continue;
    }
    let bytes: ArrayBuffer;
    try {
      const res = await fetch(asset.storage_url, { credentials: 'include' });
      if (!res.ok) {
        return {
          status: 'network-error',
          error: `asset ${asset.sha256.slice(0, 12)} HTTP ${res.status}`,
          fetched,
          reused,
        };
      }
      bytes = await res.arrayBuffer();
    } catch (err) {
      return { status: 'network-error', error: (err as Error).message, fetched, reused };
    }
    const actualSha = await sha256Hex(bytes);
    if (actualSha !== asset.sha256) {
      // Sha mismatch is a hard failure — refuse to install a corrupt asset.
      return {
        status: 'verify-failed',
        error: `asset ${asset.kind}/${asset.source_row_id} sha mismatch`,
        fetched,
        reused,
      };
    }
    const record: ContentPackAssetRecord = {
      sha256: asset.sha256,
      kind: asset.kind,
      source_row_id: asset.source_row_id,
      pack_id: signed.manifest.pack_id,
      bytes,
      size_bytes: asset.size_bytes,
      cached_at: Date.now(),
    };
    await db.put('content-pack-assets', record);
    fetched += 1;
  }

  // Atomically swap the pack metadata. Old assets that aren't referenced by
  // the new pack stay in IDB and are reclaimed by a future GC pass.
  const record: ContentPackRecord = {
    key: 'latest',
    pack_id: signed.manifest.pack_id,
    version: signed.manifest.version,
    manifest_sha256: descriptor.manifest_sha256,
    signing_kid: signed.signing_kid,
    signature_b64: signed.signature_b64,
    total_bytes: signed.manifest.total_bytes,
    signed_at: Date.parse(descriptor.signed_at),
    installed_at: Date.now(),
    manifest_json: signed.manifest,
  };
  await db.put('content-pack', record);

  return {
    status: 'installed',
    pack_id: signed.manifest.pack_id,
    version: signed.manifest.version,
    fetched,
    reused,
  };
}

/**
 * Drops everything — pack metadata + every cached asset. Used by the
 * runbook "client purge" step when a pack is kill-switched on the server.
 */
export async function purgeCachedPack(): Promise<void> {
  const db = await openDb();
  await db.clear('content-pack');
  await db.clear('content-pack-assets');
}
