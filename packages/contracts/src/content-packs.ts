import { z } from 'zod';

// Content packs (PRD §5.2). A signed bundle the PWA caches locally so the app
// works for ≥7 days offline (hard constraint #2). The manifest_json is signed
// with an ed25519 key; the client verifies with the public key shipped via
// CONTENT_PACK_SIGNING_PUBKEY before installing a pack.

export const ContentPackAssetKind = z.enum([
  'CURRICULUM_CHUNK',
  'PRACTICE_PROBLEM',
  'ACADEMY_LESSON',
  'OLYMPIAD_BRIEF',
]);
export type ContentPackAssetKind = z.infer<typeof ContentPackAssetKind>;

export const ContentPackAsset = z.object({
  kind: ContentPackAssetKind,
  /** Source row id in the kind's owning table (e.g. academy_lessons.lesson_id). */
  source_row_id: z.number().int(),
  sha256: z.string(),
  size_bytes: z.number().int().nonnegative(),
  /** Where the client fetches the asset bytes from. Object storage in prod. */
  storage_url: z.string(),
});
export type ContentPackAsset = z.infer<typeof ContentPackAsset>;

/** The canonical manifest signed by the server and verified by the client. */
export const ContentPackManifest = z.object({
  pack_id: z.number().int(),
  version: z.number().int().positive(),
  organization_code: z.string().nullable(),
  built_at: z.string().datetime(),
  total_bytes: z.number().int().nonnegative(),
  assets: z.array(ContentPackAsset),
});
export type ContentPackManifest = z.infer<typeof ContentPackManifest>;

/** What GET /content-packs/latest returns — metadata + signature, no bytes. */
export const ContentPackDescriptor = z.object({
  pack_id: z.number().int(),
  version: z.number().int().positive(),
  organization_code: z.string().nullable(),
  manifest_sha256: z.string(),
  signature_b64: z.string(),
  signing_kid: z.string(),
  total_bytes: z.number().int().nonnegative(),
  signed_at: z.string().datetime(),
  /** Where to GET the full manifest (asset urls + sha256). */
  manifest_url: z.string(),
});
export type ContentPackDescriptor = z.infer<typeof ContentPackDescriptor>;

/** A signed manifest payload — manifest + matching signature. */
export const SignedContentPack = z.object({
  manifest: ContentPackManifest,
  signature_b64: z.string(),
  signing_kid: z.string(),
});
export type SignedContentPack = z.infer<typeof SignedContentPack>;
