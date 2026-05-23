import { Module } from '@nestjs/common';

import { ContentPacksController } from './content-packs.controller';
import { PackBuilderService } from './pack-builder.service';
import { PackSignerService } from './pack-signer.service';

/**
 * Content packs (PRD §5.2) — signed bundles the PWA caches locally so the
 * app works for ≥7 days offline. Signing is ed25519; clients verify with
 * the public key shipped via CONTENT_PACK_SIGNING_PUBKEY before installing.
 */
@Module({
  controllers: [ContentPacksController],
  providers: [PackBuilderService, PackSignerService],
  exports: [PackBuilderService],
})
export class ContentPacksModule {}
