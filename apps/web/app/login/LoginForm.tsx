'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { UserRole } from '@studyteach/contracts';

import { StButton, StCard, StIcon, StInput, StSoyomboFlame, type IconName } from '@/components/st';
import { login, verify2fa } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/base';

type Phase = { kind: 'creds' } | { kind: 'otp'; challenge: string };

/** The five login roles, in tab order, with their post-login destination. */
const ROLES: { role: UserRole; labelKey: string; subKey: string; icon: IconName; path: string }[] =
  [
    {
      role: 'STUDENT',
      labelKey: 'roleStudent',
      subKey: 'roleSubStudent',
      icon: 'school',
      path: '/student',
    },
    {
      role: 'TEACHER',
      labelKey: 'roleTeacher',
      subKey: 'roleSubTeacher',
      icon: 'users',
      path: '/teacher',
    },
    {
      role: 'PARENT',
      labelKey: 'roleParent',
      subKey: 'roleSubParent',
      icon: 'heart',
      path: '/parent',
    },
    {
      role: 'SCHOOL_ADMIN',
      labelKey: 'roleSchool',
      subKey: 'roleSubSchool',
      icon: 'flag',
      path: '/school',
    },
    {
      role: 'PLATFORM_ADMIN',
      labelKey: 'roleAdmin',
      subKey: 'roleSubAdmin',
      icon: 'shield',
      path: '/admin',
    },
  ];

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params?.get('next') ?? null;

  const [role, setRole] = useState<UserRole>('STUDENT');
  const [phase, setPhase] = useState<Phase>({ kind: 'creds' });
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = ROLES.find((r) => r.role === role)!;
  /** Post-login destination — explicit ?next wins, else the picked role's home. */
  const destination = redirectTo ?? selected.path;

  async function handleCreds(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(phone.trim(), password);
      if (res.kind === 'requires_2fa') {
        setPhase({ kind: 'otp', challenge: res.challenge });
        setSubmitting(false);
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch (e) {
      setError(toMessage(e, t, 'errorInvalid'));
      setSubmitting(false);
    }
  }

  async function handleOtp(e: FormEvent) {
    e.preventDefault();
    if (phase.kind !== 'otp') return;
    setError(null);
    setSubmitting(true);
    try {
      await verify2fa(phase.challenge, otp.trim());
      router.replace(destination);
      router.refresh();
    } catch (e) {
      setError(toMessage(e, t, 'errorOtp'));
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-8 sm:px-6 sm:py-10">
      <StCard padding="lg" className="w-full">
        <div className="flex items-center gap-3">
          <StSoyomboFlame size={28} />
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
              {phase.kind === 'creds' ? t('title') : t('otpTitle')}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {phase.kind === 'creds' ? t(selected.subKey) : t('otpSubtitle')}
            </p>
          </div>
        </div>

        {phase.kind === 'creds' && (
          <>
            <p
              className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('roleEyebrow')}
            </p>
            <div
              className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5"
              role="tablist"
              aria-label={t('roleEyebrow')}
              data-testid="login-roles"
            >
              {ROLES.map((r) => {
                const active = r.role === role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRole(r.role)}
                    data-testid={`login-role-${r.role}`}
                    className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-st-md border px-1 py-2 text-[11px] font-semibold transition-colors"
                    style={
                      active
                        ? {
                            background: 'var(--st-soot)',
                            color: '#FBF3E2',
                            borderColor: 'var(--st-soot)',
                          }
                        : {
                            background: 'var(--st-paper)',
                            color: 'var(--st-ink-2)',
                            borderColor: 'rgba(185, 132, 56, 0.4)',
                          }
                    }
                  >
                    <StIcon name={r.icon} size={16} color={active ? '#D4A24C' : undefined} />
                    {t(r.labelKey)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase.kind === 'creds' ? (
          <form className="mt-5 space-y-3" onSubmit={handleCreds} data-testid="login-form">
            <Field
              label={t('phoneLabel')}
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              required
              testid="login-phone"
            />
            <Field
              label={t('passwordLabel')}
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
              testid="login-password"
            />
            <FormFooter
              error={error}
              submitting={submitting}
              submitLabel={t('submit')}
              submittingLabel={t('submitting')}
              testid="login-submit"
            />
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={handleOtp} data-testid="otp-form">
            <Field
              label={t('otpLabel')}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={setOtp}
              autoComplete="one-time-code"
              required
              testid="otp-code"
            />
            <FormFooter
              error={error}
              submitting={submitting}
              submitLabel={t('otpSubmit')}
              submittingLabel={t('submitting')}
              testid="otp-submit"
            />
          </form>
        )}
      </StCard>
    </main>
  );
}

function Field({
  label,
  testid,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testid: string;
  type?: string;
  inputMode?: 'numeric';
  pattern?: string;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="block text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {label}
      </span>
      <StInput
        className="mt-1"
        data-testid={testid}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}

function FormFooter({
  error,
  submitting,
  submitLabel,
  submittingLabel,
  testid,
}: {
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  testid: string;
}) {
  return (
    <div className="pt-2">
      {error && (
        <p role="alert" className="mb-2 text-xs" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}
      <StButton
        type="submit"
        variant="primary"
        size="md"
        disabled={submitting}
        data-testid={testid}
      >
        <StIcon name="arrow_r" size={14} />
        {submitting ? submittingLabel : submitLabel}
      </StButton>
    </div>
  );
}

function toMessage(
  e: unknown,
  t: ReturnType<typeof useTranslations>,
  fallbackKey: 'errorInvalid' | 'errorOtp',
): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return t(fallbackKey);
    return e.message || t('errorGeneric');
  }
  return t('errorGeneric');
}
