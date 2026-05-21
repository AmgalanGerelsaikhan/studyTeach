import { StIcon } from '@/components/st';

export function SmsPreview({
  title,
  body,
  sender = '+976 11 33-22-11',
}: {
  title: string;
  body: string;
  sender?: string;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-st-lg p-3"
      style={{
        background: 'var(--st-paper)',
        border: '1px solid rgba(185, 132, 56, 0.35)',
        boxShadow: 'var(--st-shadow-sm)',
      }}
      data-testid="parent-sms-preview"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: 'var(--st-soot)', color: '#F4C99A' }}
        >
          <StIcon name="sms" size={14} />
        </span>
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-ink-3)' }}
          >
            {title}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--st-ink-3)', opacity: 0.7 }}>
            {sender}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-snug" style={{ color: 'var(--st-ink)' }}>
        {body}
      </p>
    </section>
  );
}
