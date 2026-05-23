import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { EbarimtService } from './ebarimt.service';

@Controller()
@UseGuards(RolesGuard)
export class EbarimtController {
  constructor(
    private readonly ebarimt: EbarimtService,
    private readonly db: Db,
  ) {}

  /**
   * Manual retry for stuck invoices. PLATFORM_ADMIN only — ops escalation
   * path documented in the S05 plan R-8.
   */
  @Post('admin/ebarimt/retry/:id')
  @Roles('PLATFORM_ADMIN')
  async retry(
    @Param('id', ParseIntPipe) invoiceId: number,
  ): Promise<{ ebarimt_id: string; replayed: boolean }> {
    return this.ebarimt.issue(invoiceId);
  }

  /**
   * Stream the receipt PDF for an invoice the caller issued. Scoped by
   * issued_to so a student/teacher only sees their own invoices.
   */
  @Get('payments/invoices/:id/receipt.pdf')
  @Roles('STUDENT', 'TEACHER')
  async receiptPdf(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('id', ParseIntPipe) invoiceId: number,
    @Res() res: Response,
  ): Promise<void> {
    if (!ctx) throw new UnauthorizedException();
    const { rows } = await this.db.query<{ issued_to: number }>(
      `SELECT issued_to FROM invoices WHERE invoice_id = $1`,
      [invoiceId],
    );
    if (!rows[0]) throw new NotFoundException('invoice not found');
    if (rows[0].issued_to !== ctx.user_id) throw new NotFoundException('invoice not found');
    try {
      const pdf = await this.ebarimt.generatePdf(invoiceId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="ebarimt-${invoiceId}.pdf"`);
      res.send(pdf);
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : 'pdf generation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
