import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { SchoolLookupResult, SchoolTeachersResponse } from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { SchoolService } from './school.service';

const ListQuery = z.object({
  organization_code: z.string().optional(),
});

const LookupQuery = z.object({
  q: z.string().max(80).optional().default(''),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

@Controller()
export class SchoolController {
  constructor(private readonly school: SchoolService) {}

  /**
   * Anonymous school-picker source for the signup wizard. Returns the safe
   * public subset of `schools`. No auth needed — school names + aimag are
   * public information. Capped at 50 rows to keep payloads small on 3G.
   */
  @Get('schools/lookup')
  async lookup(@Query() raw: unknown): Promise<{ items: SchoolLookupResult[] }> {
    const parsed = LookupQuery.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const items = await this.school.lookup(parsed.data.q, parsed.data.limit);
    return { items };
  }

  /**
   * Teachers at the caller's school. SCHOOL_ADMIN is locked to their own
   * org (organization_code is forced from the request context, the query
   * param is ignored for non-PLATFORM callers). PLATFORM_ADMIN can read
   * any org by passing `?organization_code=`.
   */
  @Get('school/teachers')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async listTeachers(
    @CurrentContext() ctx: RequestContext | undefined,
    @Query() raw: unknown,
  ): Promise<SchoolTeachersResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = ListQuery.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const orgCode =
      ctx.primary_role === 'PLATFORM_ADMIN'
        ? (parsed.data.organization_code ?? null)
        : ctx.organization_code;
    if (!orgCode) {
      throw new ForbiddenException('organization_code is required');
    }
    const items = await this.school.listTeachers(orgCode);
    return { organization_code: orgCode, items };
  }
}
