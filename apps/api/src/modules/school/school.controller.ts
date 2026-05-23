import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { SchoolTeachersResponse } from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { SchoolService } from './school.service';

const ListQuery = z.object({
  organization_code: z.string().optional(),
});

@Controller()
@UseGuards(RolesGuard)
export class SchoolController {
  constructor(private readonly school: SchoolService) {}

  /**
   * Teachers at the caller's school. SCHOOL_ADMIN is locked to their own
   * org (organization_code is forced from the request context, the query
   * param is ignored for non-PLATFORM callers). PLATFORM_ADMIN can read
   * any org by passing `?organization_code=`.
   */
  @Get('school/teachers')
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
