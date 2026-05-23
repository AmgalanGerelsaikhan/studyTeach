import { Module } from '@nestjs/common';

import { AuditModule } from '../../lib/audit/audit.module';

import { PsrController } from './psr.controller';
import { PsrService } from './psr.service';

/**
 * Portable Student Record — PRD §4.9. National-ID-keyed transcript that
 * follows a herder family's child across school transfers. Owner controls
 * per-school read access; every read writes an audit_log row including the
 * reader's stated reason.
 */
@Module({
  imports: [AuditModule],
  controllers: [PsrController],
  providers: [PsrService],
  exports: [PsrService],
})
export class PsrModule {}
