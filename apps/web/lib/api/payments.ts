import type { InvoiceDescriptor, TicketResponse } from '@studyteach/contracts';

import { uuidv7 } from '../offline/uuid';

import { apiFetch } from './base';

export function createInvoice(registrationIds: number[]): Promise<InvoiceDescriptor> {
  return apiFetch<InvoiceDescriptor>('/payments/invoices', {
    method: 'POST',
    body: {
      registration_ids: registrationIds,
      idempotency_key: uuidv7(),
    },
  });
}

export function getInvoice(invoiceId: number): Promise<InvoiceDescriptor> {
  return apiFetch<InvoiceDescriptor>(`/payments/invoices/${invoiceId}`);
}

export function getTicket(registrationId: number): Promise<TicketResponse> {
  return apiFetch<TicketResponse>(`/registrations/${registrationId}/ticket`);
}
