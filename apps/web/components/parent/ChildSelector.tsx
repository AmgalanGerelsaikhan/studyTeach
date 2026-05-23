import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { LinkedChild } from '@studyteach/contracts';

import { StAvatar } from '@/components/st';

/**
 * Tab-style child switcher. Server component: tab activation is driven by
 * the `?child=<student_id>` query param, so there is no client state and the
 * 3G page is shaved of one client island.
 *
 * Each tab is a `<Link>` so prefetch behaviour and bookmarking both work.
 * Mirrors the "МИНИЙ ХҮҮХДҮҮД" row in `studyTeach (2)/family.jsx → ParentPortal`.
 */
export async function ChildSelector({
  children,
  activeStudentId,
}: {
  children: LinkedChild[];
  activeStudentId: number | null;
}) {
  const t = await getTranslations('parent');
  if (children.length === 0) return null;
  return (
    <div role="group" aria-label={t('tabs.child')} data-testid="parent-child-selector">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--st-ink-3)' }}
      >
        {t('tabs.child')}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {children.map((child) => {
          const active = child.student_id === activeStudentId;
          const initial = child.student_name.trim().charAt(0) || '·';
          const gradeLabel =
            typeof child.grade === 'number' ? `${child.grade}-р анги` : child.school_name;
          return (
            <Link
              key={child.link_id}
              href={`/parent?child=${child.student_id}`}
              prefetch={false}
              // aria-pressed is button-only; for a link tab the correct
              // active marker is aria-current="page" (axe aria-allowed-attr).
              aria-current={active ? 'page' : undefined}
              data-child-id={child.student_id}
              data-active={active ? 'true' : undefined}
              className="st-card-lift flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5"
              style={{
                background: active ? 'var(--st-soot)' : 'var(--st-paper)',
                color: active ? '#FBF3E2' : 'var(--st-ink-2)',
                borderColor: active ? 'var(--st-soot)' : 'rgba(185,132,56,0.35)',
                textDecoration: 'none',
              }}
            >
              <StAvatar initial={initial} tone={active ? 'ember' : 'brass'} size={26} />
              <span className="text-[12px] font-semibold">
                {child.student_name}
                <span
                  className="ml-1 text-[10px] font-normal"
                  style={{ opacity: active ? 0.75 : 0.6 }}
                >
                  · {gradeLabel}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
