import type { ReactNode } from 'react';

import { StIcon, StSoyomboFlame } from '@/components/st';
import { StOfflineBadge } from '@/components/system/StOfflineBadge';

/** Mobile-first chrome wrapper. On small screens it fills the viewport (390px
 * baseline). On desktop it pins to a 390×844 frame so designers and reviewers
 * can sanity-check the layout next to the prototype. */
export function ParentChrome({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-stretch justify-center px-0 sm:px-4 sm:py-6"
      style={{
        background:
          'radial-gradient(circle at 10% 0%, rgba(255,235,200,0.6), transparent 40%), var(--st-cream)',
      }}
    >
      <div
        className="flex w-full flex-col sm:rounded-[28px]"
        data-testid="parent-chrome"
        style={{
          maxWidth: 390,
          minHeight: 844,
          background: 'var(--st-paper)',
          border: '1px solid rgba(185,132,56,0.35)',
          boxShadow: 'var(--st-shadow-md)',
          overflow: 'hidden',
        }}
      >
        <header
          className="flex items-center justify-between px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid rgba(185,132,56,0.25)' }}
        >
          <div className="flex items-center gap-2">
            <StSoyomboFlame size={22} />
            <span className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
              studyTeach
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <StOfflineBadge compact />
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full p-1.5"
              style={{ color: 'var(--st-ink-2)' }}
            >
              <StIcon name="bell" size={16} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
