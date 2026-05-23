import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  CreateParentLinkRequest,
  RevokeSchoolAccessRequest,
  VerifyParentLinkRequest,
  type ChildSummary,
  type CreateParentLinkResponse,
  type LinkedChild,
  type ParentAuditEntry,
} from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { ParentService } from './parent.service';

@Controller()
@UseGuards(RolesGuard)
export class ParentController {
  constructor(
    private readonly db: Db,
    private readonly parents: ParentService,
  ) {}

  @Post('parent/links')
  @Roles('PARENT')
  async createLink(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<CreateParentLinkResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = CreateParentLinkRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const phone = await this.parentPhone(ctx.user_id);
    if (!phone) throw new UnauthorizedException('no phone on file');

    const result = await this.parents.createLink({
      parentUserId: ctx.user_id,
      parentPhone: phone,
      nationalIdHash: parsed.data.national_id_hash,
      schoolCode: parsed.data.school_code,
    });
    return {
      link_id: result.link_id,
      status: 'PENDING',
      otp_challenge: result.otp_challenge,
    };
  }

  @Post('parent/links/verify')
  @Roles('PARENT')
  async verifyLink(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<LinkedChild> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = VerifyParentLinkRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.parents.verifyLink({
      parentUserId: ctx.user_id,
      challenge: parsed.data.challenge,
      code: parsed.data.code,
    });
  }

  @Get('parent/children')
  @Roles('PARENT')
  async listChildren(
    @CurrentContext() ctx: RequestContext | undefined,
  ): Promise<{ items: LinkedChild[] }> {
    if (!ctx) throw new UnauthorizedException();
    const items = await this.parents.listChildren(ctx.user_id);
    return { items };
  }

  @Get('parent/children/:studentId/summary')
  @Roles('PARENT')
  async childSummary(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('studentId') studentIdRaw: string,
  ): Promise<ChildSummary> {
    if (!ctx) throw new UnauthorizedException();
    const studentId = parsePositiveInt(studentIdRaw, 'student_id');
    return this.parents.getChildSummary({
      parentUserId: ctx.user_id,
      studentId,
    });
  }

  @Post('parent/links/:linkId/revoke')
  @Roles('PARENT')
  async revokeLink(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('linkId') linkIdRaw: string,
  ): Promise<{ revoked: boolean }> {
    if (!ctx) throw new UnauthorizedException();
    const linkId = parsePositiveInt(linkIdRaw, 'link_id');
    await this.parents.revokeLink({ parentUserId: ctx.user_id, linkId });
    return { revoked: true };
  }

  @Post('parent/revoke-school')
  @Roles('PARENT')
  async revokeSchool(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<{ revoked_count: number }> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = RevokeSchoolAccessRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.parents.revokeSchoolAccess({
      parentUserId: ctx.user_id,
      schoolCode: parsed.data.school_code,
      reason: parsed.data.reason ?? null,
    });
  }

  @Get('parent/audit')
  @Roles('PARENT')
  async auditTrail(
    @CurrentContext() ctx: RequestContext | undefined,
  ): Promise<{ items: ParentAuditEntry[] }> {
    if (!ctx) throw new UnauthorizedException();
    const items = await this.parents.auditTrail(ctx.user_id);
    return { items };
  }

  private async parentPhone(userId: number): Promise<string | null> {
    const { rows } = await this.db.query<{ phone_number: string | null }>(
      `SELECT phone_number FROM users WHERE user_id = $1`,
      [userId],
    );
    return rows[0]?.phone_number ?? null;
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}
