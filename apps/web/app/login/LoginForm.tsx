'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StCard, StIcon, StInput, StSoyomboFlame } from '@/components/st';
import { login, postLoginPath, verify2fa } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/base';

type Phase = { kind: 'creds' } | { kind: 'otp'; challenge: string };

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params?.get('next') ?? null;

  const [phase, setPhase] = useState<Phase>({ kind: 'creds' });
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.replace(redirectTo ?? postLoginPath(res.me.primary_role));
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
      const me = await verify2fa(phase.challenge, otp.trim());
      router.replace(redirectTo ?? postLoginPath(me.primary_role));
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
              {phase.kind === 'creds' ? t('subtitle') : t('otpSubtitle')}
            </p>
          </div>
        </div>

        {phase.kind === 'creds' ? (
          <form className="mt-6 space-y-3" onSubmit={handleCreds} data-testid="login-form">
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
