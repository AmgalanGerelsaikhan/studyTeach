import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePsrGrantRequest,
  type PortableStudentRecord,
  type PsrAccessGrant,
  type PsrAuditEntry,
} from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { PsrService } from './psr.service';

const ReadQuery = z.object({
  reason: z.string().min(3).max(500),
});

@Controller()
@UseGuards(RolesGuard)
export class PsrController {
  constructor(private readonly psr: PsrService) {}

  @Get('psr/me')
  @Roles('STUDENT')
  async me(@CurrentContext() ctx: RequestContext | undefined): Promise<PortableStudentRecord> {
    if (!ctx) throw new UnauthorizedException();
    return this.psr.getOwn(ctx.user_id);
  }

  @Get('psr/me/audit')
  @Roles('STUDENT')
  async meAudit(
    @CurrentContext() ctx: RequestContext | undefined,
  ): Promise<{ items: PsrAuditEntry[] }> {
    if (!ctx) throw new UnauthorizedException();
    const items = await this.psr.ownAudit(ctx.user_id);
    return { items };
  }

  @Get('psr/me/grants')
  @Roles('STUDENT')
  async meGrants(
    @CurrentContext() ctx: RequestContext | undefined,
  ): Promise<{ items: PsrAccessGrant[] }> {
    if (!ctx) throw new UnauthorizedException();
    const items = await this.psr.listOwnGrants(ctx.user_id);
    return { items };
  }

  @Post('psr/me/grants')
  @Roles('STUDENT')
  async createGrant(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<PsrAccessGrant> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = CreatePsrGrantRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.psr.createGrant({
      callerUserId: ctx.user_id,
      granteeSchoolCode: parsed.data.grantee_school_code,
      reason: parsed.data.reason ?? null,
    });
  }

  @Delete('psr/me/grants/:grantId')
  @Roles('STUDENT')
  async revokeGrant(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('grantId') grantIdRaw: string,
  ): Promise<{ revoked: boolean }> {
    if (!ctx) throw new UnauthorizedException();
    const grantId = parsePositiveInt(grantIdRaw, 'grant_id');
    await this.psr.revokeGrant({ callerUserId: ctx.user_id, grantId });
    return { revoked: true };
  }

  /**
   * Cross-school read. The caller supplies a `reason` query param that is
   * persisted in the audit log so the record-owner sees WHY each read
   * happened. Required by PRD §4.9 + Mongolian PDP Law (2021) §X.
   */
  @Get('psr/:uuid')
  @Roles('TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async byUuid(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('uuid') uuid: string,
    @Query() rawQuery: unknown,
  ): Promise<PortableStudentRecord> {
    if (!ctx) throw new UnauthorizedException();
    if (!/^[0-9a-fA-F-]{36}$/.test(uuid)) {
      throw new BadRequestException('invalid uuid');
    }
    const query = ReadQuery.safeParse(rawQuery);
    if (!query.success) {
      throw new BadRequestException('reason query param is required (3-500 chars)');
    }
    return this.psr.getByUuid({
      callerUserId: ctx.user_id,
      callerRole: ctx.primary_role,
      callerOrganizationCode: ctx.organization_code,
      targetUuid: uuid,
      reason: query.data.reason,
    });
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}
