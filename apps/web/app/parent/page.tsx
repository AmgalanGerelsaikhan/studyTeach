import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { StCard, StLinkButton } from '@/components/st';
import { ChildSelector } from '@/components/parent/ChildSelector';
import { ChildSummary } from '@/components/parent/ChildSummary';
import { listChildrenServer } from '@/lib/api/parent';

/**
 * Parent hub. Server component: fetches the linked children, picks the
 * active one from `?child=<student_id>`, and renders the in-page summary.
 *
 * Audit note: every render that shows a summary causes the backend to write
 * a `parent.summary.read` audit_log row. That is correct — it is the entire
 * point of the audit trail (PRD §4.8).
 */
export const dynamic = 'force-dynamic';

export default async function ParentHome({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations('parent');
  const cookieHeader = cookies().toString();

  let children: Awaited<ReturnType<typeof listChildrenServer>>['items'] = [];
  let loadError = false;
  try {
    const res = await listChildrenServer(cookieHeader);
    children = res.items;
  } catch {
    loadError = true;
  }

  const requested = pickStudentId(searchParams.child);
  const active = children.find((c) => c.student_id === requested) ?? children[0] ?? null;

  return (
    <div className="flex flex-col gap-4" data-testid="parent-home">
      <StCard padding="md">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
      </StCard>

      {loadError ? (
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      ) : children.length === 0 ? (
        <StCard padding="md">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('empty.title')}
          </h2>
          <p className="mt-1 mb-3 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('empty.subtitle')}
          </p>
          <StLinkButton href="/parent/link" variant="primary" size="md">
            {t('empty.cta')}
          </StLinkButton>
        </StCard>
      ) : (
        <>
          <ChildSelector children={children} activeStudentId={active ? active.student_id : null} />
          {active && <ChildSummary child={active} />}
        </>
      )}

      <FooterLinks />
    </div>
  );
}

function pickStudentId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function FooterLinks() {
  const t = await getTranslations('parent');
  return (
    <nav
      aria-label={t('footerNavLabel')}
      className="mt-2 flex items-center justify-center gap-3 pb-2 text-[12px]"
    >
      <Link href="/parent/link" className="font-semibold" style={{ color: 'var(--st-brass-dark)' }}>
        {t('footer.linkChild')}
      </Link>
      <span style={{ color: 'var(--st-ink-3)' }}>·</span>
      <Link
        href="/parent/settings"
        className="font-semibold"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('footer.settings')}
      </Link>
      <span style={{ color: 'var(--st-ink-3)' }}>·</span>
      <Link
        href="/parent/audit"
        className="font-semibold"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('footer.audit')}
      </Link>
    </nav>
  );
}
