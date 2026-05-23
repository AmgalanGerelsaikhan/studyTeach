import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { LinkedChild } from '@studyteach/contracts';

import { StCard, StChip, StDivider, StLinkButton } from '@/components/st';
import { RevokeButton } from '@/components/parent/RevokeButton';
import { listChildrenServer } from '@/lib/api/parent';

/**
 * Revocation matrix. For each VERIFIED link the parent can:
 *   - revoke this specific link (POST /parent/links/:linkId/revoke)
 *   - revoke every link at the same school (POST /parent/revoke-school)
 *
 * Both buttons are confirm-then-fire client islands. After success the
 * island calls router.refresh(), which re-runs this server component and the
 * revoked link drops off the list.
 *
 * Per-school grouping is computed server-side so the page is fully static.
 */
export const dynamic = 'force-dynamic';

export default async function ParentSettingsPage() {
  const t = await getTranslations('parent');
  const cookieHeader = cookies().toString();

  let children: LinkedChild[] = [];
  let loadError = false;
  try {
    const res = await listChildrenServer(cookieHeader);
    children = res.items;
  } catch {
    loadError = true;
  }

  // Group VERIFIED links by school so we can render the "revoke all at
  // school X" button once per school.
  const bySchool = new Map<string, { schoolName: string; links: LinkedChild[] }>();
  for (const child of children) {
    const entry = bySchool.get(child.school_code);
    if (entry) {
      entry.links.push(child);
    } else {
      bySchool.set(child.school_code, {
        schoolName: child.school_name,
        links: [child],
      });
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="parent-settings">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {loadError ? (
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      ) : bySchool.size === 0 ? (
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('settings.noLinks')}
          </p>
          <div className="mt-3">
            <StLinkButton href="/parent/link" variant="primary" size="sm">
              {t('empty.cta')}
            </StLinkButton>
          </div>
        </StCard>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from(bySchool.entries()).map(([schoolCode, { schoolName, links }]) => (
            <StCard key={schoolCode} padding="md">
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                    {schoolCode}
                  </p>
                  <h2
                    className="font-display text-base font-bold"
                    style={{ color: 'var(--st-soot)' }}
                  >
                    {schoolName}
                  </h2>
                </div>
                <RevokeButton
                  kind="school"
                  schoolCode={schoolCode}
                  schoolName={schoolName}
                  variant="secondary"
                  size="sm"
                />
              </header>
              <div className="mt-3">
                <StDivider />
              </div>
              <ul className="mt-1 flex flex-col">
                {links.map((link, i) => (
                  <li key={link.link_id}>
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-semibold"
                          style={{ color: 'var(--st-soot)' }}
                        >
                          {link.student_name}
                        </p>
                        <div
                          className="mt-0.5 flex items-center gap-2 text-[11px]"
                          style={{ color: 'var(--st-ink-3)' }}
                        >
                          {typeof link.grade === 'number' && (
                            <StChip tone="default">{link.grade}-р анги</StChip>
                          )}
                          {link.is_boarding && (
                            <StChip tone="sky">{t('summary.boardingChip')}</StChip>
                          )}
                          <span>{formatDate(link.verified_at)}</span>
                        </div>
                      </div>
                      <RevokeButton
                        kind="link"
                        linkId={link.link_id}
                        childName={link.student_name}
                        schoolName={schoolName}
                        variant="secondary"
                        size="sm"
                      />
                    </div>
                    {i < links.length - 1 && <StDivider />}
                  </li>
                ))}
              </ul>
            </StCard>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-center">
        <StLinkButton href="/parent" variant="secondary" size="sm">
          {t('link.backToHub')}
        </StLinkButton>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}
