import Link from 'next/link';

import {
  StCard,
  StChip,
  StIcon,
  StLinkButton,
  StSoyomboFlame,
  type IconName,
} from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';

interface Props {
  roleLabel: string;
  title: string;
  subtitle: string;
  /** Feature lines this persona will get — shown as a checklist. */
  features: string[];
  icon: IconName;
}

/**
 * Shared placeholder shell for persona surfaces that don't have a full
 * app yet (School admin, Platform admin). Real features land in later
 * sprints — this gives the login flow a valid, branded destination.
 */
export function PersonaStub({ roleLabel, title, subtitle, features, icon }: Props) {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12"
      data-testid="persona-stub"
    >
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="MozaTeach" className="flex items-center gap-2">
          <StSoyomboFlame size={26} />
          <span className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            MozaTeach
          </span>
        </Link>
        <span className="ml-auto flex items-center gap-2">
          <StChip tone="soot">
            <StIcon name={icon} size={12} />
            {roleLabel}
          </StChip>
          {/* Logout chip — without this the persona is a dead-end. */}
          <AuthStatus />
        </span>
      </header>

      <StCard variant="soot" padding="lg" className="mt-6">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#D4A24C' }}
        >
          {roleLabel}
        </p>
        <h1
          className="mt-2 font-display text-2xl font-bold sm:text-3xl"
          style={{ color: '#FBF3E2' }}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#D8BC85' }}>
          {subtitle}
        </p>
      </StCard>

      <StCard padding="md" className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          Удахгүй
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-sm"
              style={{ color: 'var(--st-ink-2)' }}
            >
              <span className="mt-0.5 flex-shrink-0">
                <StIcon name="clock" size={13} color="var(--st-brass)" />
              </span>
              {f}
            </li>
          ))}
        </ul>
      </StCard>

      <div className="mt-6">
        <StLinkButton href="/" variant="secondary" size="sm">
          <StIcon name="arrow_l" size={12} />
          Нүүр хуудас
        </StLinkButton>
      </div>
    </main>
  );
}
