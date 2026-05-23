import { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ContentPackAssetKind,
  type ContentPackDescriptor,
  type SignedContentPack,
} from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { PackBuilderService } from './pack-builder.service';

const LatestQuery = z.object({
  organization_code: z.string().optional(),
});

const BuildBody = z.object({
  /** Null builds the national catalog pack; otherwise the org overlay. */
  organization_code: z.string().nullable().default(null),
});

@Controller()
@UseGuards(RolesGuard)
export class ContentPacksController {
  constructor(private readonly builder: PackBuilderService) {}

  /**
   * Returns the descriptor (metadata + signature) of the latest non-revoked
   * pack visible to the caller. The PWA calls this on every install + nightly
   * sync; if `manifest_sha256` matches what's cached, no further work.
   */
  @Get('content-packs/latest')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async latest(
    @CurrentContext() ctx: RequestContext | undefined,
    @Query() raw: unknown,
  ): Promise<ContentPackDescriptor> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = LatestQuery.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const requested = parsed.data.organization_code ?? null;
    // Non-platform users can only see their own org or the national pack.
    if (ctx.primary_role !== 'PLATFORM_ADMIN') {
      if (requested !== null && requested !== ctx.organization_code) {
        throw new ForbiddenException("cannot read another org's pack");
      }
    }
    const desc = await this.builder.latest(requested);
    if (!desc) throw new NotFoundException('no content pack available');
    return desc;
  }

  /** Full signed manifest (asset list + sig). Same RBAC as /latest. */
  @Get('content-packs/:packId/manifest')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async manifest(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('packId') packIdRaw: string,
  ): Promise<SignedContentPack> {
    if (!ctx) throw new UnauthorizedException();
    const packId = parsePositiveInt(packIdRaw, 'pack_id');
    const signed = await this.builder.manifest(packId);
    if (!signed) throw new NotFoundException('pack not found');
    if (ctx.primary_role !== 'PLATFORM_ADMIN') {
      const orgOfPack = signed.manifest.organization_code;
      if (orgOfPack !== null && orgOfPack !== ctx.organization_code) {
        throw new ForbiddenException("cannot read another org's pack");
      }
    }
    return signed;
  }

  /**
   * Triggers a build of the national or org-overlay pack. PLATFORM_ADMIN only.
   * In prod this is what a nightly cron calls; in dev a human runs it after
   * editing the seed.
   */
  @Post('content-packs/build')
  @Roles('PLATFORM_ADMIN')
  async build(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<ContentPackDescriptor> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = BuildBody.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.builder.build({
      organizationCode: parsed.data.organization_code,
      builtByUserId: ctx.user_id,
    });
  }

  /**
   * Raw asset bytes for the (kind, source_row_id) pair referenced by
   * `storage_url` in a manifest. The PWA verifies each fetched byte stream
   * against the manifest's sha256 before installing.
   *
   * In prod the manifest's storage_url is rewritten to an R2/S3 CDN edge and
   * this endpoint becomes the fallback. Dev uses it directly.
   */
  @Get('content-packs/assets/:kind/:sourceId')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async asset(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('kind') rawKind: string,
    @Param('sourceId') rawSourceId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!ctx) throw new UnauthorizedException();
    const kind = ContentPackAssetKind.safeParse(rawKind);
    if (!kind.success) throw new BadRequestException('invalid asset kind');
    const sourceId = parsePositiveInt(rawSourceId, 'source_id');
    const bytes = await this.builder.fetchAssetBytes(kind.data, sourceId);
    if (bytes === null) throw new NotFoundException('asset not found');
    // Plain text — the source rows are mn-Cyrl strings. Binary assets (images,
    // PDFs) land in a follow-up that uploads to object storage at build time.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Long cache OK — the manifest sha256 changes if the bytes change.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(bytes);
  }

  /** Flips a pack's kill_switch — clients purge it on next sync. */
  @Post('content-packs/:packId/revoke')
  @Roles('PLATFORM_ADMIN')
  async revoke(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('packId') packIdRaw: string,
  ): Promise<{ revoked: boolean }> {
    if (!ctx) throw new UnauthorizedException();
    const packId = parsePositiveInt(packIdRaw, 'pack_id');
    const ok = await this.builder.revoke(packId);
    if (!ok) throw new NotFoundException('pack not found');
    return { revoked: true };
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}
