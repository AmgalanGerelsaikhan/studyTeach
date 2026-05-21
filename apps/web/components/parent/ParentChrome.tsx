'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { StIcon, StMeander, StSoyomboFlame } from '@/components/st';

/**
 * Mobile-first phone chrome matching `studyTeach (2)/family.jsx → ParentPortal`
 * (line 7). On small screens it fills the viewport; on lg+ it pins to a 390×844
 * frame inside a soft cream radial so designers and reviewers can sanity-check
 * the layout next to the prototype.
 *
 * Header is soot-coloured with a synthetic phone status bar (time, network,
 * battery) and a Khamar khee meander accent below, matching the mockup. The
 * meander height is reduced from 10 → 9 to compensate for the platform's
 * subpixel border at the meander seam.
 */
export function ParentChrome({ children }: { children: ReactNode }) {
  const t = useTranslations('parent');
  const now = useCurrentClock();
  return (
    <div
      className="flex min-h-screen items-stretch justify-center px-0 sm:px-4 sm:py-6"
      style={{
        background:
          'radial-gradient(circle at 10% 0%, rgba(255,235,200,0.6), transparent 40%), var(--st-cream)',
      }}
    >
      <div
        className="flex w-full min-h-screen flex-col sm:min-h-[844px] sm:rounded-[28px]"
        data-testid="parent-chrome"
        style={{
          maxWidth: 420,
          background: 'var(--st-cream)',
          border: '1px solid rgba(185,132,56,0.35)',
          boxShadow: 'var(--st-shadow-md)',
          overflow: 'hidden',
        }}
      >
        {/* phone status bar */}
        <div
          className="flex h-[34px] items-center justify-between px-5 text-[12px] font-semibold"
          style={{ background: 'var(--st-soot)', color: '#F4E8D1' }}
        >
          <span>{now}</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span>2G</span>
            <span>67%</span>
          </div>
        </div>

        {/* soot header with logo + bell */}
        <header
          className="flex items-center gap-2 px-5 pb-3 pt-2"
          style={{ background: 'var(--st-soot)', color: '#F4E8D1' }}
        >
          <StSoyomboFlame size={20} color="#D4A24C" />
          <div className="flex-1">
            <p className="font-display text-[15px] font-bold" style={{ color: '#FBF3E2' }}>
              studyTeach
            </p>
            <p className="text-[9.5px] tracking-[0.15em]" style={{ color: '#B98438' }}>
              {t('headerLabel')}
            </p>
          </div>
          <button type="button" aria-label="notifications" className="rounded-full p-1.5">
            <StIcon name="bell" size={18} color="#D4A24C" />
          </button>
        </header>

        <StMeander tone="soot" height={9} />

        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

function useCurrentClock(): string {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    };
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
