'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { UserRole } from '@studyteach/contracts';

import { StButton, StCard, StIcon, StInput, StSoyomboFlame } from '@/components/st';
import { postLoginPath, register } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/base';

const ROLE_OPTIONS: UserRole[] = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

export function SignupForm() {
  const t = useTranslations('signup');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();

  const initialRole = parseRole(params?.get('role')) ?? 'STUDENT';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await register({ phone: phone.trim(), password, role });
      router.replace(postLoginPath(me.primary_role));
      router.refresh();
    } catch (e) {
      setError(toMessage(e, t));
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
              {t('title')}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {t('subtitle')}
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} data-testid="signup-form">
          <FieldLabel label={tAuth('phoneLabel')}>
            <StInput
              type="tel"
              placeholder={tAuth('phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
              data-testid="signup-phone"
            />
          </FieldLabel>

          <FieldLabel label={tAuth('passwordLabel')} hint={t('passwordHint')}>
            <div className="relative">
              <StInput
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                data-testid="signup-password"
                className="pr-11"
              />
              <button
                type="button"
                aria-label={showPw ? t('hidePassword') : t('showPassword')}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md"
                style={{ color: 'var(--st-ink-2)' }}
                data-testid="signup-password-toggle"
              >
                <StIcon name={showPw ? 'eye' : 'lock'} size={14} />
              </button>
            </div>
          </FieldLabel>

          <FieldLabel label={t('roleLabel')}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="st-input mt-1 block w-full appearance-none rounded-st-md border bg-paper px-3 py-2.5 text-sm"
              style={{
                background: 'var(--st-paper)',
                color: 'var(--st-ink)',
                borderColor: 'rgba(185, 132, 56, 0.5)',
              }}
              required
              data-testid="signup-role"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {tAuth(roleLabelKey(r))}
                </option>
              ))}
            </select>
          </FieldLabel>

          <div className="pt-2">
            {error && (
              <p
                role="alert"
                className="mb-2 text-xs"
                style={{ color: 'var(--st-cinnabar)' }}
                data-testid="signup-error"
              >
                {error}
              </p>
            )}
            <StButton
              type="submit"
              variant="primary"
              size="md"
              block
              disabled={submitting}
              data-testid="signup-submit"
            >
              <StIcon name="arrow_r" size={14} />
              {submitting ? t('submitting') : t('submit')}
            </StButton>
          </div>
        </form>

        <p
          className="mt-5 text-center text-[12px]"
          style={{ color: 'var(--st-ink-2)' }}
          data-testid="signup-login-link"
        >
          {t('haveAccount')}{' '}
          <Link
            href="/login"
            className="font-semibold underline"
            style={{ color: 'var(--st-ember)' }}
          >
            {tAuth('title')}
          </Link>
        </p>
      </StCard>
    </main>
  );
}

function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {hint && (
        <span className="mt-1 block text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function parseRole(raw: string | null): UserRole | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const result = UserRole.safeParse(upper);
  return result.success ? result.data : null;
}

function roleLabelKey(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return 'roleStudent';
    case 'TEACHER':
      return 'roleTeacher';
    case 'PARENT':
      return 'roleParent';
    case 'SCHOOL_ADMIN':
      return 'roleSchool';
    case 'PLATFORM_ADMIN':
      return 'roleAdmin';
  }
}

function toMessage(e: unknown, t: ReturnType<typeof useTranslations>): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return t('errorConflict');
    if (e.status === 400) return t('errorValidation');
    return e.message || t('errorGeneric');
  }
  return t('errorGeneric');
}
