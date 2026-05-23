'use client';

import { StIcon } from '@/components/st';
import { useOfflineStatus } from '@/lib/offline/useOfflineStatus';

/** Network + queue indicator pill used in persona top bars / sidebars. */
export function StOfflineBadge({ compact = false }: { compact?: boolean }) {
  const { online, pending, syncing } = useOfflineStatus();
  const label = (() => {
    if (!online) return pending > 0 ? `Холболтгүй · ${pending} хүлээж буй` : 'Холболтгүй';
    if (syncing) return 'Илгээж байна…';
    if (pending > 0) return `${pending} илгээгдэхээр`;
    return 'Холболттой';
  })();
  const tone: 'ok' | 'warn' | 'off' = !online ? 'off' : pending > 0 || syncing ? 'warn' : 'ok';
  const palette = {
    ok: { bg: 'var(--st-moss)', color: '#FBF3E2' },
    warn: { bg: 'var(--st-warn)', color: 'var(--st-soot)' },
    off: { bg: 'var(--st-soot)', color: '#F4C99A' },
  } as const;
  return (
    <span
      aria-live="polite"
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ background: palette[tone].bg, color: palette[tone].color, borderWidth: 0 }}
      title={label}
      aria-label={label}
    >
      <StIcon name={tone === 'off' ? 'wifi_off' : 'sparkle'} size={11} />
      {/* compact = icon only; label survives in aria-label + title for a11y */}
      {!compact && <span>{label}</span>}
    </span>
  );
}
