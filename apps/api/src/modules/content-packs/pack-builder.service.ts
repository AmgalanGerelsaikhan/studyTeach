import { createHash } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ContentPackAsset,
  ContentPackAssetKind,
  ContentPackDescriptor,
  ContentPackManifest,
} from '@studyteach/contracts';

import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { canonicalize, PackSignerService } from './pack-signer.service';

interface AssetSourceRow {
  source_row_id: number;
  bytes: string;
}

/**
 * Assembles a signed content pack from the live catalog tables.
 *
 * Asset bytes are NOT uploaded to object storage in this version — the
 * `storage_url` in each asset is a synthetic API path that points back at
 * /content-packs/:pack_id/assets/:kind/:source_row_id. A follow-up epic will
 * push the bytes to R2/S3 and rewrite the urls to a CDN edge. The signature
 * contract is unchanged either way: the manifest is what's signed.
 */
@Injectable()
export class PackBuilderService {
  private readonly log = new Logger(PackBuilderService.name);

  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly db: Db,
    private readonly signer: PackSignerService,
  ) {}

  /**
   * Builds the next version of a pack for the given org (NULL = national pack)
   * and persists it with a fresh signature. Idempotent on `(organization_code,
   * content fingerprint)`: if the resulting manifest_sha256 matches the latest
   * non-revoked pack, returns that pack instead of inserting a new version.
   */
  async build(input: {
    organizationCode: string | null;
    builtByUserId: number | null;
  }): Promise<ContentPackDescriptor> {
    const assets = await this.collectAssets();
    const totalBytes = assets.reduce((sum, a) => sum + a.size_bytes, 0);
    // Content-only fingerprint — invariant to version/build_at/pack_id, so we
    // can detect "nothing changed since the last build" and skip the insert.
    const contentFingerprint = createHash('sha256')
      .update(canonicalize(assets), 'utf8')
      .digest('hex');

    const latest = await this.db.query<{
      pack_id: string;
      version: number;
      manifest_json: ContentPackManifest;
      manifest_sha256: string;
      signature_b64: string;
      signing_kid: string;
      total_bytes: string;
      signed_at: Date;
    }>(
      `SELECT pack_id::text, version, manifest_json, manifest_sha256, signature_b64,
              signing_kid, total_bytes::text, signed_at
         FROM content_packs
        WHERE COALESCE(organization_code, '') = COALESCE($1, '')
          AND kill_switch = FALSE
        ORDER BY version DESC LIMIT 1`,
      [input.organizationCode],
    );
    const latestRow = latest.rows[0];
    if (latestRow) {
      const latestFingerprint = createHash('sha256')
        .update(canonicalize(latestRow.manifest_json.assets), 'utf8')
        .digest('hex');
      if (latestFingerprint === contentFingerprint) {
        this.log.log(
          `pack content unchanged for org=${input.organizationCode ?? 'NULL'} → reusing v${latestRow.version}`,
        );
        return descriptorFromRow(latestRow, this.env.CONTENT_PACK_ASSET_BASE_URL);
      }
    }

    const nextVersion = (latestRow?.version ?? 0) + 1;
    const manifestSeed = {
      version: nextVersion,
      organization_code: input.organizationCode,
      total_bytes: totalBytes,
      assets,
    };
    const canonicalSeed = canonicalize(manifestSeed);
    const sig = await this.signer.sign(canonicalSeed);

    const { rows: packRows } = await this.db.query<{ pack_id: string; signed_at: Date }>(
      `INSERT INTO content_packs
         (version, organization_code, manifest_json, signature_b64,
          signing_kid, manifest_sha256, total_bytes, built_by_user_id)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
       RETURNING pack_id::text, signed_at`,
      [
        nextVersion,
        input.organizationCode,
        canonicalSeed,
        sig.signature_b64,
        sig.signing_kid,
        sig.manifest_sha256,
        totalBytes,
        input.builtByUserId,
      ],
    );
    const packId = Number(packRows[0]!.pack_id);
    const signedAt = packRows[0]!.signed_at;
    for (const a of assets) {
      await this.db.query(
        `INSERT INTO content_pack_assets
           (pack_id, kind, source_row_id, sha256, size_bytes, storage_url)
         VALUES ($1, $2::content_pack_asset_kind, $3, $4, $5, $6)`,
        [packId, a.kind, a.source_row_id, a.sha256, a.size_bytes, a.storage_url],
      );
    }
    this.log.log(
      `built pack v${nextVersion} for org=${input.organizationCode ?? 'NULL'} (${assets.length} assets, ${totalBytes}B)`,
    );
    return {
      pack_id: packId,
      version: nextVersion,
      organization_code: input.organizationCode,
      manifest_sha256: sig.manifest_sha256,
      signature_b64: sig.signature_b64,
      signing_kid: sig.signing_kid,
      total_bytes: totalBytes,
      signed_at: signedAt.toISOString(),
      manifest_url: `${this.env.CONTENT_PACK_ASSET_BASE_URL}/${packId}/manifest`,
    };
  }

  /** Returns the latest non-revoked pack descriptor for the org (or NULL). */
  async latest(organizationCode: string | null): Promise<ContentPackDescriptor | null> {
    const { rows } = await this.db.query<{
      pack_id: string;
      version: number;
      manifest_json: ContentPackManifest;
      manifest_sha256: string;
      signature_b64: string;
      signing_kid: string;
      total_bytes: string;
      signed_at: Date;
    }>(
      `SELECT pack_id::text, version, manifest_json, manifest_sha256, signature_b64,
              signing_kid, total_bytes::text, signed_at
         FROM content_packs
        WHERE COALESCE(organization_code, '') = COALESCE($1, '')
          AND kill_switch = FALSE
        ORDER BY version DESC LIMIT 1`,
      [organizationCode],
    );
    const r = rows[0];
    if (!r) return null;
    return descriptorFromRow(r, this.env.CONTENT_PACK_ASSET_BASE_URL);
  }

  /** Returns the full signed manifest payload for a pack (asset list + sig). */
  async manifest(packId: number): Promise<{
    manifest: ContentPackManifest;
    signature_b64: string;
    signing_kid: string;
  } | null> {
    const { rows } = await this.db.query<{
      pack_id: string;
      version: number;
      organization_code: string | null;
      manifest_json: ContentPackManifest;
      signature_b64: string;
      signing_kid: string;
    }>(
      `SELECT pack_id::text, version, organization_code, manifest_json, signature_b64, signing_kid
         FROM content_packs WHERE pack_id = $1`,
      [packId],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      manifest: { ...r.manifest_json, pack_id: Number(r.pack_id) },
      signature_b64: r.signature_b64,
      signing_kid: r.signing_kid,
    };
  }

  async revoke(packId: number): Promise<boolean> {
    const { rowCount } = await this.db.query(
      `UPDATE content_packs SET kill_switch = TRUE WHERE pack_id = $1`,
      [packId],
    );
    return (rowCount ?? 0) > 0;
  }

  /**
   * Returns the raw asset bytes for a (kind, source_row_id) pair, matching
   * exactly what was hashed at pack-build time. The PWA fetches these to
   * populate its IndexedDB cache and verifies each one against the manifest's
   * `sha256`. In prod the storage_url is rewritten to an R2/S3 CDN edge; this
   * endpoint is the dev + fallback path.
   *
   * Returns null when the source row doesn't exist (e.g. course deleted after
   * pack was signed) — caller should serve 404. The signed manifest's sha will
   * no longer match in that case, which is by design (kill_switch the pack).
   */
  async fetchAssetBytes(kind: ContentPackAssetKind, sourceRowId: number): Promise<string | null> {
    switch (kind) {
      case 'CURRICULUM_CHUNK': {
        const { rows } = await this.db.query<{ body: string }>(
          `SELECT body FROM curriculum_chunks WHERE chunk_id = $1`,
          [sourceRowId],
        );
        return rows[0]?.body ?? null;
      }
      case 'PRACTICE_PROBLEM': {
        const { rows } = await this.db.query<{ bytes: string }>(
          `SELECT COALESCE(prompt, '') || '|' || COALESCE(answer_key, '') AS bytes
             FROM practice_problems WHERE problem_id = $1`,
          [sourceRowId],
        );
        return rows[0]?.bytes ?? null;
      }
      case 'ACADEMY_LESSON': {
        const { rows } = await this.db.query<{ transcript_mn: string }>(
          `SELECT COALESCE(transcript_mn, '') AS transcript_mn
             FROM academy_lessons WHERE lesson_id = $1`,
          [sourceRowId],
        );
        return rows[0]?.transcript_mn ?? null;
      }
      case 'OLYMPIAD_BRIEF': {
        const { rows } = await this.db.query<{ bytes: string }>(
          `SELECT COALESCE(title, '') || '|' || COALESCE(organizer, '') AS bytes
             FROM olympiads WHERE olympiad_id = $1`,
          [sourceRowId],
        );
        return rows[0]?.bytes ?? null;
      }
      default:
        return null;
    }
  }

  /**
   * Pulls every catalog row that should ship in the pack and hashes its bytes.
   * National catalog only in v1 — org-scoped overlays are a follow-up.
   */
  private async collectAssets(): Promise<ContentPackAsset[]> {
    const out: ContentPackAsset[] = [];
    const base = this.env.CONTENT_PACK_ASSET_BASE_URL;

    out.push(
      ...(await this.fetchAssets('CURRICULUM_CHUNK', base, async () => {
        const { rows } = await this.db.query<AssetSourceRow>(
          `SELECT chunk_id AS source_row_id, body AS bytes FROM curriculum_chunks`,
        );
        return rows;
      })),
    );
    out.push(
      ...(await this.fetchAssets('PRACTICE_PROBLEM', base, async () => {
        const { rows } = await this.db.query<AssetSourceRow>(
          `SELECT problem_id AS source_row_id,
                  COALESCE(prompt, '') || '|' || COALESCE(answer_key, '') AS bytes
             FROM practice_problems`,
        );
        return rows;
      })),
    );
    out.push(
      ...(await this.fetchAssets('ACADEMY_LESSON', base, async () => {
        const { rows } = await this.db.query<AssetSourceRow>(
          `SELECT lesson_id AS source_row_id, COALESCE(transcript_mn, '') AS bytes
             FROM academy_lessons`,
        );
        return rows;
      })),
    );
    out.push(
      ...(await this.fetchAssets('OLYMPIAD_BRIEF', base, async () => {
        const { rows } = await this.db.query<AssetSourceRow>(
          `SELECT olympiad_id AS source_row_id,
                  COALESCE(title, '') || '|' || COALESCE(organizer, '') AS bytes
             FROM olympiads`,
        );
        return rows;
      })),
    );
    // Deterministic order — required so seedSha is stable across builds.
    return out.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
      return a.source_row_id - b.source_row_id;
    });
  }

  private async fetchAssets(
    kind: ContentPackAssetKind,
    base: string,
    fetcher: () => Promise<AssetSourceRow[]>,
  ): Promise<ContentPackAsset[]> {
    const rows = await fetcher();
    return rows.map((r) => {
      const buf = Buffer.from(r.bytes, 'utf8');
      return {
        kind,
        source_row_id: r.source_row_id,
        sha256: createHash('sha256').update(buf).digest('hex'),
        size_bytes: buf.length,
        storage_url: `${base}/assets/${kind}/${r.source_row_id}`,
      };
    });
  }
}

/** Maps a content_packs row (with pack_id as text) to the wire descriptor. */
function descriptorFromRow(
  row: {
    pack_id: string;
    version: number;
    manifest_json: ContentPackManifest;
    manifest_sha256: string;
    signature_b64: string;
    signing_kid: string;
    total_bytes: string;
    signed_at: Date;
  },
  assetBaseUrl: string,
): ContentPackDescriptor {
  const packId = Number(row.pack_id);
  return {
    pack_id: packId,
    version: row.version,
    organization_code: row.manifest_json.organization_code,
    manifest_sha256: row.manifest_sha256,
    signature_b64: row.signature_b64,
    signing_kid: row.signing_kid,
    total_bytes: Number(row.total_bytes),
    signed_at: row.signed_at.toISOString(),
    manifest_url: `${assetBaseUrl}/${packId}/manifest`,
  };
}
