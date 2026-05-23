import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';

import { PracticeService } from './practice.service';

const ListQuery = z.object({
  lang: z.enum(['mn-Cyrl', 'mn-Latn', 'en']).default('mn-Cyrl'),
  subject: z.string().min(1).max(50),
  grade: z.coerce.number().int().min(1).max(12),
  strand: z.string().min(1).max(100).optional(),
  k: z.coerce.number().int().min(1).max(20).default(2),
});

@Controller('practice-problems')
@UseGuards(RolesGuard)
export class PracticeController {
  constructor(private readonly service: PracticeService) {}

  @Get()
  @Roles('STUDENT', 'TEACHER', 'PARENT')
  async list(@Query() rawQuery: unknown) {
    const parsed = ListQuery.safeParse(rawQuery);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    return this.service.find(parsed.data);
  }
}
