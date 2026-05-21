import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { TicketResponse } from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { TicketService } from './ticket.service';

@Controller('registrations')
@UseGuards(RolesGuard)
export class TicketController {
  constructor(
    private readonly tickets: TicketService,
    private readonly db: Db,
  ) {}

  @Get(':id/ticket')
  @Roles('STUDENT')
  async getTicket(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('id', ParseIntPipe) registrationId: number,
  ): Promise<TicketResponse> {
    if (!ctx) throw new UnauthorizedException();
    const { rows } = await this.db.query<{ student_id: number }>(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [ctx.user_id],
    );
    const studentId = rows[0]?.student_id;
    if (!studentId) throw new NotFoundException('student record missing for this user');
    return this.tickets.getForStudent(registrationId, studentId);
  }
}
