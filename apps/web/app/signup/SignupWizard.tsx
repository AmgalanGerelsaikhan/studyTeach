'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SchoolLookupResult, SignupProfile } from '@studyteach/contracts';

import { StButton, StCard, StIcon, StInput } from '@/components/st';
import { MozaLogo } from '@/components/system/MozaLogo';
import { postLoginPath, register } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/base';
import { lookupSchools } from '@/lib/api/schools';
import {
  ROLE_LABELS,
  SELECTABLE_ROLES,
  WIZARD_BY_ROLE,
  type WizardStep,
} from '@/lib/signup/wizard-config';

type Phase = { kind: 'role' } | { kind: 'steps'; role: SelectableRole; idx: number };
type SelectableRole = (typeof SELECTABLE_ROLES)[number];

type StepValue = string;

function parseRole(raw: string | null): SelectableRole | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  return (SELECTABLE_ROLES as readonly string[]).includes(upper) ? (upper as SelectableRole) : null;
}

export function SignupWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = parseRole(params?.get('role'));

  const [phase, setPhase] = useState<Phase>(
    initialRole ? { kind: 'steps', role: initialRole, idx: 0 } : { kind: 'role' },
  );
  const [values, setValues] = useState<Record<string, StepValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function chooseRole(role: SelectableRole) {
    setPhase({ kind: 'steps', role, idx: 0 });
  }

  function setValue(key: string, v: StepValue) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  const steps = phase.kind === 'steps' ? WIZARD_BY_ROLE[phase.role] : [];
  const currentStep = phase.kind === 'steps' ? steps[phase.idx]! : null;
  const isLast = phase.kind === 'steps' && phase.idx === steps.length - 1;

  async function advance() {
    if (phase.kind !== 'steps' || !currentStep) return;
    const v = values[currentStep.key] ?? '';
    const err = validate(currentStep, v);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (!isLast) {
      setPhase({ kind: 'steps', role: phase.role, idx: phase.idx + 1 });
      return;
    }
    await submit(phase.role);
  }

  function back() {
    if (phase.kind !== 'steps') return;
    setError(null);
    if (phase.idx === 0) {
      setPhase({ kind: 'role' });
      return;
    }
    setPhase({ kind: 'steps', role: phase.role, idx: phase.idx - 1 });
  }

  async function submit(role: SelectableRole) {
    setSubmitting(true);
    setError(null);
    try {
      const profile: SignupProfile = {
        full_name: values.full_name ?? '',
        ...(values.grade ? { grade: values.grade } : {}),
        ...(values.subject ? { subject: values.subject } : {}),
        ...(values.experience_years ? { experience_years: values.experience_years } : {}),
        ...(values.position ? { position: values.position } : {}),
        ...(values.child_school_code ? { child_school_code: values.child_school_code } : {}),
      };
      const me = await register({
        phone: (values.phone_number ?? '').trim(),
        password: values.password ?? '',
        role,
        email: values.email?.trim() || undefined,
        organization_code: values.school_code || undefined,
        profile,
      });
      router.replace(postLoginPath(me.primary_role));
      router.refresh();
    } catch (e) {
      setError(toMessage(e));
      setSubmitting(false);
    }
  }

  // Enter advances; not bound while submitting or while choosing role.
  useEffect(() => {
    if (phase.kind !== 'steps') return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        const target = ev.target as HTMLElement | null;
        // Don't double-fire from inputs whose own onSubmit handles it.
        if (target?.tagName === 'TEXTAREA') return;
        ev.preventDefault();
        void advance();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, values, submitting, advance]);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-8 sm:px-6 sm:py-10">
      <StCard padding="lg" className="w-full">
        <Header />
        {phase.kind === 'steps' && <ProgressBar current={phase.idx + 1} total={steps.length} />}

        {phase.kind === 'role' ? (
          <RoleChooser onPick={chooseRole} />
        ) : (
          <StepRenderer
            step={currentStep!}
            value={values[currentStep!.key] ?? ''}
            onChange={(v) => setValue(currentStep!.key, v)}
            stepNumber={phase.idx + 1}
            error={error}
            submitting={submitting}
          />
        )}

        {phase.kind === 'steps' && (
          <Footer isLast={isLast} submitting={submitting} onAdvance={advance} onBack={back} />
        )}

        {phase.kind === 'role' && (
          <p className="mt-5 text-center text-[12px]" style={{ color: 'var(--st-ink-2)' }}>
            Бүртгэлтэй юу?{' '}
            <Link
              href="/login"
              className="font-semibold underline"
              style={{ color: 'var(--st-ember)' }}
            >
              Нэвтрэх
            </Link>
          </p>
        )}
      </StCard>
    </main>
  );
}

function Header() {
  return (
    <div>
      <MozaLogo size="md" />
      <div className="mt-4">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          Шинэ бүртгэл
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          Хэдхэн алхамд бүртгэлээ үүсгэнэ.
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mt-5" aria-label={`Алхам ${current}/${total}`}>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(185, 132, 56, 0.2)' }}>
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--st-brass-bright) 0%, var(--st-ember) 100%)',
          }}
        />
      </div>
      <p
        className="mt-1.5 text-right text-[10px] tracking-[0.1em]"
        style={{ color: 'var(--st-ink-3)' }}
      >
        {current} / {total}
      </p>
    </div>
  );
}

function RoleChooser({ onPick }: { onPick: (role: SelectableRole) => void }) {
  return (
    <div className="mt-5">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        Би хэн бэ?
      </p>
      <div className="mt-2 flex flex-col gap-2" role="radiogroup" aria-label="Хэрэглэгчийн төрөл">
        {SELECTABLE_ROLES.map((r, i) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => onPick(r)}
            data-testid={`signup-role-${r}`}
            className="flex items-center gap-3 rounded-st-md border px-3 py-2.5 text-left text-sm font-semibold transition-colors"
            style={{
              background: 'var(--st-paper)',
              color: 'var(--st-ink)',
              borderColor: 'rgba(185, 132, 56, 0.5)',
            }}
          >
            <LetterBadge letter={String.fromCharCode(65 + i)} />
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepRenderer({
  step,
  value,
  onChange,
  stepNumber,
  error,
  submitting,
}: {
  step: WizardStep;
  value: string;
  onChange: (v: string) => void;
  stepNumber: number;
  error: string | null;
  submitting: boolean;
}) {
  return (
    <div className="mt-6" data-testid={`signup-step-${step.key}`}>
      <div className="flex items-start gap-2">
        <NumberBadge n={stepNumber} />
        <div className="flex-1">
          <h2
            className="font-display text-lg font-bold leading-tight"
            style={{ color: 'var(--st-soot)' }}
          >
            {step.label}
            {step.required && <span style={{ color: 'var(--st-ember)' }}> *</span>}
          </h2>
          {step.note && (
            <p className="mt-1 text-[12px]" style={{ color: 'var(--st-ink-3)' }}>
              {step.note}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <FieldByType step={step} value={value} onChange={onChange} disabled={submitting} />
        {step.hint && (
          <p className="mt-1.5 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
            {step.hint}
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 text-xs"
          style={{ color: 'var(--st-cinnabar)' }}
          data-testid="signup-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function FieldByType({
  step,
  value,
  onChange,
  disabled,
}: {
  step: WizardStep;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  switch (step.type) {
    case 'text':
    case 'tel':
    case 'email':
      return (
        <StInput
          type={step.type}
          placeholder={step.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          disabled={disabled}
          data-testid={`signup-input-${step.key}`}
        />
      );
    case 'password':
      return (
        <PasswordField
          value={value}
          onChange={onChange}
          showToggle={step.showToggle ?? true}
          disabled={disabled}
          testid={`signup-input-${step.key}`}
        />
      );
    case 'radio':
      return (
        <RadioField
          options={step.options ?? []}
          value={value}
          onChange={onChange}
          disabled={disabled}
          stepKey={step.key}
        />
      );
    case 'school-picker':
      return (
        <SchoolPicker
          value={value}
          onChange={onChange}
          disabled={disabled}
          testid={`signup-input-${step.key}`}
        />
      );
  }
}

function PasswordField({
  value,
  onChange,
  showToggle,
  disabled,
  testid,
}: {
  value: string;
  onChange: (v: string) => void;
  showToggle: boolean;
  disabled: boolean;
  testid: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <StInput
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        autoFocus
        disabled={disabled}
        data-testid={testid}
        className={showToggle ? 'pr-11' : undefined}
      />
      {showToggle && (
        <button
          type="button"
          aria-label={show ? 'Нууц үг нуух' : 'Нууц үг харах'}
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md"
          style={{ color: 'var(--st-ink-2)' }}
          data-testid={`${testid}-toggle`}
        >
          <StIcon name={show ? 'eye' : 'lock'} size={14} />
        </button>
      )}
    </div>
  );
}

function RadioField({
  options,
  value,
  onChange,
  disabled,
  stepKey,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  stepKey: string;
}) {
  // Letter shortcuts: pressing A/B/C/... selects the matching option.
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (disabled) return;
      const k = ev.key.toUpperCase();
      if (k.length !== 1 || k < 'A' || k > 'Z') return;
      const idx = k.charCodeAt(0) - 65;
      if (idx >= options.length) return;
      // Don't hijack while typing in an input.
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      ev.preventDefault();
      onChange(options[idx]!.key);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, disabled, onChange]);

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={stepKey}>
      {options.map((opt, i) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.key)}
            disabled={disabled}
            data-testid={`signup-option-${stepKey}-${opt.key}`}
            className="flex items-center gap-3 rounded-st-md border px-3 py-2.5 text-left text-sm font-semibold transition-colors"
            style={
              active
                ? { background: 'var(--st-soot)', color: '#FBF3E2', borderColor: 'var(--st-soot)' }
                : {
                    background: 'var(--st-paper)',
                    color: 'var(--st-ink)',
                    borderColor: 'rgba(185, 132, 56, 0.5)',
                  }
            }
          >
            <LetterBadge letter={String.fromCharCode(65 + i)} active={active} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SchoolPicker({
  value,
  onChange,
  disabled,
  testid,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  testid: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SchoolLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => results.find((s) => s.school_code === value) ?? null,
    [results, value],
  );

  const search = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const items = await lookupSchools(query);
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load.
    void search('');
  }, [search]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void search(q);
    }, 200);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, search]);

  return (
    <div className="flex flex-col gap-2">
      <StInput
        type="search"
        placeholder="Сургуулийн нэр эсвэл аймаг…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
        autoFocus
        data-testid={`${testid}-search`}
      />
      {selected && (
        <div
          className="rounded-st-md border px-3 py-2 text-[13px]"
          style={{
            background: 'var(--st-paper-2)',
            borderColor: 'var(--st-brass)',
            color: 'var(--st-soot)',
          }}
          data-testid={`${testid}-selected`}
        >
          <span className="font-semibold">{selected.name}</span> · {selected.aimag}
        </div>
      )}
      <div
        className="max-h-[180px] overflow-y-auto rounded-st-md border"
        style={{ borderColor: 'rgba(185, 132, 56, 0.4)' }}
      >
        {loading && (
          <p className="px-3 py-2 text-[12px]" style={{ color: 'var(--st-ink-3)' }}>
            Хайж байна…
          </p>
        )}
        {!loading && results.length === 0 && (
          <p
            className="px-3 py-2 text-[12px]"
            style={{ color: 'var(--st-ink-3) ' }}
            data-testid={`${testid}-empty`}
          >
            Сургууль олдсонгүй. Холбоо барина уу: hello@mozateach.mn
          </p>
        )}
        {!loading &&
          results.map((s) => {
            const active = s.school_code === value;
            return (
              <button
                key={s.school_code}
                type="button"
                onClick={() => onChange(s.school_code)}
                disabled={disabled}
                data-testid={`${testid}-option-${s.school_code}`}
                className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left text-[13px] last:border-b-0"
                style={{
                  background: active ? 'var(--st-soot)' : 'transparent',
                  color: active ? '#FBF3E2' : 'var(--st-ink)',
                  borderColor: 'rgba(185, 132, 56, 0.2)',
                }}
              >
                <span>
                  <span className="font-semibold">{s.name}</span>
                  <span
                    className="ml-2 text-[11px]"
                    style={{ color: active ? '#D4A24C' : 'var(--st-ink-3)' }}
                  >
                    {s.aimag}
                  </span>
                </span>
                <span className="text-[10px] font-mono tracking-[0.1em]">{s.school_code}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <span
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold"
      style={{ background: 'var(--st-soot)', color: '#D4A24C' }}
    >
      {n}
    </span>
  );
}

function LetterBadge({ letter, active = false }: { letter: string; active?: boolean }) {
  return (
    <span
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
      style={{
        background: active ? '#D4A24C' : 'var(--st-paper-2)',
        color: active ? 'var(--st-soot)' : 'var(--st-ink-2)',
        border: '1px solid rgba(185, 132, 56, 0.4)',
      }}
    >
      {letter}
    </span>
  );
}

function Footer({
  isLast,
  submitting,
  onAdvance,
  onBack,
}: {
  isLast: boolean;
  submitting: boolean;
  onAdvance: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-2">
      <StButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={onBack}
        disabled={submitting}
        data-testid="signup-back"
      >
        <StIcon name="arrow_l" size={12} />
        Буцах
      </StButton>
      <StButton
        type="button"
        variant="primary"
        size="md"
        onClick={onAdvance}
        disabled={submitting}
        data-testid="signup-next"
      >
        {submitting ? 'Үүсгэж байна…' : isLast ? 'Бүртгэлээ үүсгэх' : 'ОК'}
        <StIcon name="arrow_r" size={14} />
      </StButton>
    </div>
  );
}

function validate(step: WizardStep, v: string): string | null {
  const trimmed = v.trim();
  if (step.required && trimmed.length === 0) {
    return 'Энэ талбарыг бөглөнө үү.';
  }
  if (!trimmed) return null;
  const val = step.validation;
  if (val?.minLength && trimmed.length < val.minLength) {
    return `Дор хаяж ${val.minLength} тэмдэгт байх ёстой.`;
  }
  if (val?.maxLength && trimmed.length > val.maxLength) {
    return `Хамгийн ихдээ ${val.maxLength} тэмдэгт.`;
  }
  if (val?.pattern && !val.pattern.test(trimmed)) {
    if (step.type === 'tel') return 'Утасны дугаар +976XXXXXXXX хэлбэртэй байх ёстой.';
    return 'Формат буруу байна.';
  }
  if (step.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'И-мэйл хаяг буруу байна.';
  }
  return null;
}

function toMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return 'Энэ утасны дугаар аль хэдийн бүртгэлтэй байна.';
    if (e.status === 403) return 'Энэ ролд өөрөө бүртгүүлэх боломжгүй.';
    if (e.status === 400) return 'Оруулсан мэдээлэл буруу байна.';
    return e.message || 'Алдаа гарлаа. Дахин оролдоно уу.';
  }
  return 'Алдаа гарлаа. Дахин оролдоно уу.';
}
