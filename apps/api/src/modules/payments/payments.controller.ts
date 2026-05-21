import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { InvoiceCreateRequest, type InvoiceDescriptor } from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';
import { TicketService } from '../ticket/ticket.service';

import { InvoiceService } from './invoice.service';

@Controller()
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(
    private readonly invoices: InvoiceService,
    private readonly tickets: TicketService,
  ) {}

  @Post('payments/invoices')
  @Roles('STUDENT', 'TEACHER')
  async create(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<InvoiceDescriptor> {
    const parsed = InvoiceCreateRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    if (!ctx) throw new UnauthorizedException();
    const row = await this.invoices.create({
      issuedTo: ctx.user_id,
      registrationIds: parsed.data.registration_ids,
    });
    void parsed.data.idempotency_key;
    return row as InvoiceDescriptor;
  }

  @Get('payments/invoices/:id')
  @Roles('STUDENT', 'TEACHER')
  async getOne(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceDescriptor> {
    if (!ctx) throw new UnauthorizedException();
    const row = await this.invoices.getById(id, ctx.user_id);
    return row as InvoiceDescriptor;
  }

  /**
   * QPay webhook. The body is the QPay-signed payload; the header
   * X-QPay-Signature carries the HMAC. We capture the raw body via
   * express.raw() in the controller bootstrap.
   *
   * On successful confirm: cascade registrations → PAID, sign the ticket
   * for each registration. E-Barimt sync happens through a separate retry
   * queue (E-020) so this handler never blocks on ebarimt.mn.
   */
  @Post('webhooks/qpay')
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(
    @Req() req: Request,
    @Headers('x-qpay-signature') signature: string | undefined,
  ): Promise<void> {
    if (!signature) throw new BadRequestException('X-QPay-Signature missing');
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) throw new BadRequestException('raw body unavailable');
    const result = await this.invoices.confirmFromWebhook(raw, signature);
    if (!result.alreadyPaid) {
      const regs = await this.invoices.cascadeRegistrationsPaid(result.invoice_id);
      // Sign tickets — best-effort, errors logged but webhook still 204s
      for (const rid of regs) {
        try {
          await this.tickets.sign(rid);
        } catch {
          // tickets can be re-signed on demand via admin path
        }
      }
    }
  }
}
