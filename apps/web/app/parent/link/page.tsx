import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { StButton } from '@/components/st';
import { LinkFlow } from '@/components/parent/LinkFlow';

/**
 * Onboarding — link a parent account to a STUDENT account. Two-step flow:
 *   1. enter national-ID hash + school code → server sends SMS
 *   2. enter 6-digit OTP → server returns LinkedChild
 *
 * The page shell is a server component; the two-step state lives in the
 * client-side `<LinkFlow />` island.
 */
export const dynamic = 'force-dynamic';

export default async function ParentLinkPage() {
  const t = await getTranslations('parent');
  return (
    <div className="flex flex-col gap-4">
      <div className="st-page-enter">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('link.pageTitle')}
        </h1>
      </div>

      <LinkFlow />

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
