import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Me } from '@studyteach/contracts';

import { StCard, StChip, StDivider, StIcon } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { apiBase } from '@/lib/api/base';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<Me['primary_role'], string> = {
  STUDENT: 'Сурагч',
  TEACHER: 'Багш',
  PARENT: 'Эцэг эх',
  SCHOOL_ADMIN: 'Сургуулийн админ',
  PLATFORM_ADMIN: 'Системийн захиргаа',
};

/**
 * Teacher settings — identity + session controls. v1 lists the
 * caller's user_id, primary_role, organization_code, and locale; the
 * AuthStatus chip is the logout entry. Future expansions (PRD §8.1):
 * 2FA toggle, password reset, locale picker, SMS-subscription opt-outs.
 */
export default async function TeacherSettingsPage() {
  const cookieHeader = cookies().toString();
  const res = await fetch(`${apiBase()}/me`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });
  if (res.status === 401) redirect('/login');
  const me = (await res.json()) as Me;
  const t = await getTranslations('teacher.settings');

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
      </StCard>

      <StCard padding="md" className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('identity.eyebrow')}
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt style={{ color: 'var(--st-ink-3)' }}>{t('identity.userId')}</dt>
            <dd className="font-mono" style={{ color: 'var(--st-soot)' }}>
              #{me.user_id}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--st-ink-3)' }}>{t('identity.role')}</dt>
            <dd>
              <StChip tone="soot">
                <StIcon name="user" size={11} />
                {ROLE_LABEL[me.primary_role]}
              </StChip>
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--st-ink-3)' }}>{t('identity.organization')}</dt>
            <dd style={{ color: 'var(--st-soot)' }}>
              {me.organization_code ?? t('identity.organizationNone')}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--st-ink-3)' }}>{t('identity.locale')}</dt>
            <dd style={{ color: 'var(--st-soot)' }}>{me.locale}</dd>
          </div>
        </dl>
      </StCard>

      <StCard padding="md" className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('session.eyebrow')}
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('session.body')}
        </p>
        <div className="mt-3">
          <AuthStatus />
        </div>
        <StDivider />
        <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('session.upcoming')}
        </p>
      </StCard>
    </main>
  );
}
