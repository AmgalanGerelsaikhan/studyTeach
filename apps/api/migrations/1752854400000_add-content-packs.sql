-- Migration: signed offline content packs (PRD §5.2, P0 gap).
--
-- A content pack bundles curriculum, practice, academy lesson transcripts, and
-- olympiad briefs into a single signed artifact that the PWA caches locally.
-- The 7-day-offline guarantee (PRD §8.4) depends on this — without packs the
-- client has nothing to fall back to when the network drops.
--
-- Signing: ed25519 over the canonical manifest JSON. Private key lives only on
-- the API (CONTENT_PACK_SIGNING_DEV_KEY_PATH / GCP KMS in prod). Public key
-- (CONTENT_PACK_SIGNING_PUBKEY) is shipped to the client so the PWA verifies
-- before installing a pack.
--
-- Revocation: setting kill_switch = TRUE on a pack causes the next sync tick
-- to purge it. Clients re-fetch /latest and install the new version.

CREATE TYPE content_pack_asset_kind AS ENUM (
  'CURRICULUM_CHUNK',
  'PRACTICE_PROBLEM',
  'ACADEMY_LESSON',
  'OLYMPIAD_BRIEF'
);

CREATE TABLE content_packs (
  pack_id           BIGSERIAL PRIMARY KEY,
  -- Version is monotonically increasing per (organization_code, NULL = global).
  version           INTEGER     NOT NULL,
  -- Org-scoped packs override the global pack for that org. A NULL org means
  -- "national catalog" — the default fallback every client gets.
  organization_code TEXT        NULL,
  -- Canonical manifest JSON. Sha256 of this exact bytes is what the signature
  -- covers; clients verify by recomputing the hash and checking the sig.
  manifest_json     JSONB       NOT NULL,
  -- Base64-encoded ed25519 signature over manifest_json (canonical form).
  signature_b64     TEXT        NOT NULL,
  -- Key id from the signing key's JWK. Client uses this to look up the right
  -- pubkey if we ever rotate (planned: keep N-1 valid for a 7-day overlap).
  signing_kid       TEXT        NOT NULL,
  -- Hex-encoded sha256 of the manifest bytes — for fast equality checks
  -- between client cache and server-latest without re-comparing the JSON.
  manifest_sha256   TEXT        NOT NULL,
  -- Total size of all assets (sum of bytes). Clients use this to refuse
  -- installs that would overflow IndexedDB quota.
  total_bytes       BIGINT      NOT NULL DEFAULT 0,
  -- Revocation flag — flips a pack to "do not install / purge on next tick".
  kill_switch       BOOLEAN     NOT NULL DEFAULT FALSE,
  signed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Soft FK to the actor who triggered the build; nullable for system builds.
  built_by_user_id  BIGINT      NULL REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_code, version)
);

CREATE INDEX idx_content_packs_latest
  ON content_packs (organization_code, version DESC)
  WHERE kill_switch = FALSE;

CREATE TABLE content_pack_assets (
  asset_id      BIGSERIAL PRIMARY KEY,
  pack_id       BIGINT      NOT NULL REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  kind          content_pack_asset_kind NOT NULL,
  -- Source row id in the table the kind refers to. We store the id rather than
  -- duplicating content here — assets are dereferenced from the source table
  -- at manifest-build time and the bytes are uploaded to object storage. The
  -- manifest itself carries the storage url + sha256 per asset.
  source_row_id BIGINT      NOT NULL,
  sha256        TEXT        NOT NULL,
  size_bytes    BIGINT      NOT NULL,
  storage_url   TEXT        NOT NULL,
  UNIQUE (pack_id, kind, source_row_id)
);

CREATE INDEX idx_content_pack_assets_pack ON content_pack_assets (pack_id);
