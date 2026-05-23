import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { ParentAuditEntry } from '@studyteach/contracts';

import { StButton, StCard, StChip, StDivider } from '@/components/st';
import { getAuditServer } from '@/lib/api/parent';

/**
 * Audit timeline. Every read of a child's data and every link mutation
 * shows up here so a parent can verify who has looked at what.
 *
 * Action labels live in i18n under `parent.audit.actions.<action>` so we
 * can localise the audit-log vocabulary without touching the backend.
 * Unknown actions fall back to the raw key — they will surface in dev so
 * we know to add a translation.
 */
export const dynamic = 'force-dynamic';

export default async function ParentAuditPage() {
  const t = await getTranslations('parent');
  const tAction = await getTranslations('parent.audit.actions');
  const cookieHeader = cookies().toString();

  let items: ParentAuditEntry[] = [];
  let loadError = false;
  try {
    const res = await getAuditServer(cookieHeader);
    items = res.items;
  } catch {
    loadError = true;
  }

  const sorted = [...items].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

  return (
    <div className="flex flex-col gap-4" data-testid="parent-audit">
      <div className="st-page-enter">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('audit.title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('audit.subtitle')}
        </p>
      </div>

      {loadError ? (
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      ) : sorted.length === 0 ? (
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('audit.empty')}
          </p>
        </StCard>
      ) : (
        <StCard padding="tight">
          <ul className="flex flex-col">
            {sorted.map((entry, i) => (
              <li key={`${entry.occurred_at}-${i}`}>
                <div className="py-3 first:pt-1 last:pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--st-soot)' }}>
                        {actionLabel(entry.action, tAction)}
                      </p>
                      <div
                        className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"
                        style={{ color: 'var(--st-ink-3)' }}
                      >
                        <StChip tone={readerTone(entry.reader_role)}>
                          {readerRoleLabel(entry.reader_role, t)}
                        </StChip>
                        <span>{entry.reader_organization_code ?? t('audit.unknownReader')}</span>
                      </div>
                    </div>
                    <time
                      dateTime={entry.occurred_at}
                      className="whitespace-nowrap text-[11px]"
                      style={{ color: 'var(--st-ink-3)' }}
                    >
                      {formatTimestamp(entry.occurred_at)}
                    </time>
                  </div>
                </div>
                {i < sorted.length - 1 && <StDivider />}
              </li>
            ))}
          </ul>
        </StCard>
      )}

      <div className="mt-2 flex justify-center">
        <Link href="/parent">
          <StButton type="button" variant="secondary" size="sm">
            {t('link.backToHub')}
          </StButton>
        </Link>
      </div>
    </div>
  );
}

/**
 * Map raw backend actions → i18n keys. next-intl treats dots as nested-path
 * separators, so the backend strings (which themselves contain dots, e.g.
 * `parent.summary.read`) cannot be used directly as translation keys.
 *
 * Adding a new backend action: extend both this map and `parent.audit.actions`
 * in mn-Cyrl.json. Unknown actions fall back to the raw action string so a
 * missing translation surfaces in dev rather than crashing the page.
 */
const ACTION_KEY: Record<string, string> = {
  'parent.summary.read': 'summaryRead',
  'parent.link.requested': 'linkRequested',
  'parent.link.verified': 'linkVerified',
  'parent.link.revoked': 'linkRevoked',
  'parent.school.revoked': 'schoolRevoked',
};

function actionLabel(action: string, t: (key: string) => string): string {
  const key = ACTION_KEY[action];
  if (!key) return action;
  try {
    return t(key);
  } catch {
    return action;
  }
}

function readerRoleLabel(role: string, t: (key: string) => string): string {
  switch (role) {
    case 'PARENT':
      return t('audit.roles.parent');
    case 'TEACHER':
      return t('audit.roles.teacher');
    case 'SCHOOL_ADMIN':
      return t('audit.roles.schoolAdmin');
    case 'PLATFORM_ADMIN':
      return t('audit.roles.platformAdmin');
    case 'STUDENT':
      return t('audit.roles.student');
    case 'SYSTEM':
      return t('audit.roles.system');
    default:
      return role;
  }
}

function readerTone(role: string): 'ember' | 'brass' | 'sky' | 'moss' | 'soot' | 'default' {
  switch (role) {
    case 'PARENT':
      return 'brass';
    case 'TEACHER':
      return 'moss';
    case 'SCHOOL_ADMIN':
      return 'sky';
    case 'PLATFORM_ADMIN':
      return 'soot';
    case 'SYSTEM':
      return 'default';
    default:
      return 'ember';
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} · ${hh}:${mi}`;
}
