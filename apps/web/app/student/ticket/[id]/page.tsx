import { notFound } from 'next/navigation';

import { DigitalTicket } from '@/components/student/ticket/DigitalTicket';

export default function TicketPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return notFound();
  return <DigitalTicket registrationId={id} />;
}
