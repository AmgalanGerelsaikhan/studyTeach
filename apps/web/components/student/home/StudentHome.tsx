'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PredictorResponse } from '@studyteach/contracts';

import {
  StButton,
  StCard,
  StChip,
  StIcon,
  StMeander,
  StProgress,
  StSoyomboFlame,
  StSubjectGlyph,
} from '@/components/st';
import { fetchMyMastery, type MasteryRow } from '@/lib/api/ai-tutor';
import { getPredictor } from '@/lib/api/egsh';
import { listMyRegistrations } from '@/lib/api/olympiad';
import { listOlympiads } from '@/lib/api/olympiad';

import { PredictorBand } from './PredictorBand';

const SAMPLE_LESSONS = [
  {
    subject: 'physics' as const,
    title: 'Хүчний момент ба эргэх хөдөлгөөн',
    meta: '11-р анги · Физик',
    progress: 64,
    minutesLeft: 12,
  },
  {
    subject: 'math' as const,
    title: 'Логарифм тэгшитгэл',
    meta: '11-р анги · Математик · ЭЕШ',
    progress: 42,
    minutesLeft: 20,
  },
  {
    subject: 'english' as const,
    title: 'Reading: Cause & Effect Essays',
    meta: 'B2 · Англи хэл',
    progress: 88,
    minutesLeft: 5,
  },
] as const;

const QUOTA_CAP = 20;
const QUOTA_USED = 6; // stub — wire to /me/quota in a follow-up

interface RegistrationCard {
  olympiad_id: number;
  title: string;
  subject: string;
  exam_date: string;
  aimag: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
}

export function StudentHome() {
  const t = useTranslations('home');
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [predictor, setPredictor] = useState<PredictorResponse | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationCard[]>([]);

  useEffect(() => {
    fetchMyMastery()
      .then(setMastery)
      .catch(() => setMastery([]));
    getPredictor('physics')
      .then(setPredictor)
      .catch(() => setPredictor(null));
    // Cross-join my registrations with the olympiads catalog so we can show
    // titles + dates without adding a new endpoint for v1.
    (async () => {
      try {
        const [regs, cards] = await Promise.all([
          listMyRegistrations(),
          listOlympiads({ limit: 50 }),
        ]);
        const byId = new Map(cards.items.map((c) => [c.olympiad_id, c]));
        setRegistrations(
          regs
            .map((r) => {
              const card = byId.get(r.olympiad_id);
              if (!card) return null;
              return {
                olympiad_id: r.olympiad_id,
                title: card.title,
                subject: card.subject,
                exam_date: card.exam_date,
                aimag: card.aimag,
                status: r.payment_status,
              };
            })
            .filter((r): r is RegistrationCard => r !== null)
            .slice(0, 3),
        );
      } catch {
        setRegistrations([]);
      }
    })();
  }, []);

  const today = useMemo(() => formatMnDate(new Date()), []);

  return (
    <main
      className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_320px]"
      data-testid="student-home"
    >
      {/* LEFT column */}
      <div className="flex flex-col gap-5">
        <HeroCard
          today={today}
          greeting={t('greeting')}
          nudge={t('hero.nudge')}
          ctaContinue={t('hero.ctaContinue')}
          ctaPlan={t('hero.ctaWeekPlan')}
          streakLabel={t('hero.streakLabel')}
        />

        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <ContinueLessonsCard
            eyebrow={t('continue.eyebrow')}
            title={t('continue.title')}
            allLabel={t('continue.all')}
            minutesFmt={(n) => t('continue.minutesRemaining', { n })}
          />
          <MasteryCard
            eyebrow={t('mastery.eyebrow')}
            title={t('mastery.title')}
            emptyLabel={t('mastery.empty')}
            rows={mastery}
          />
        </div>

        <OlympiadsCard
          eyebrow={t('olymp.eyebrow')}
          title={t('olymp.title')}
          addLabel={t('olymp.add')}
          emptyLabel={t('olymp.empty')}
          daysLeftLabel={t('olymp.daysLeft')}
          pendingLabel={t('olymp.statusPending')}
          paidLabel={t('olymp.statusPaid')}
          registrations={registrations}
        />
      </div>

      {/* RIGHT sidebar */}
      <aside className="flex flex-col gap-5">
        <PredictorCard
          eyebrow={t('predictor.eyebrow')}
          title={t('predictor.title')}
          emptyLabel={t('predictor.empty')}
          ctaNew={t('predictor.ctaNew')}
          ctaDetail={t('predictor.ctaDetail')}
          predictor={predictor}
          footer={(sample, low, high) => t('predictor.footer', { n: sample, low, high })}
        />
        <TutorNudgeCard
          label={t('tutorNudge.label')}
          sub={t('tutorNudge.sub')}
          body={t('tutorNudge.body')}
          cta={t('tutorNudge.cta')}
          quota={t('tutorNudge.quota', { used: QUOTA_USED, cap: QUOTA_CAP })}
        />
        <PulseCard
          title={t('pulse.title')}
          anonymousLabel={t('pulse.anonymous')}
          body={t('pulse.body')}
          cta={t('pulse.cta')}
        />
      </aside>
    </main>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Cards
// ────────────────────────────────────────────────────────────────────────────

function HeroCard({
  today,
  greeting,
  nudge,
  ctaContinue,
  ctaPlan,
  streakLabel,
}: {
  today: string;
  greeting: string;
  nudge: string;
  ctaContinue: string;
  ctaPlan: string;
  streakLabel: string;
}) {
  return (
    <StCard variant="ember" padding="lg" tacked className="relative overflow-hidden">
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: '#F4C99A' }}
          >
            {today}
          </p>
          <h1
            className="mt-2 font-display text-3xl font-bold leading-tight"
            style={{ color: '#FBF3E2' }}
          >
            {greeting}
          </h1>
          <p className="mt-3 max-w-xl text-sm" style={{ color: '#F4E8D1', opacity: 0.9 }}>
            {nudge}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href="/ai-tutor" className="inline-flex">
              <StButton variant="brass" size="md" type="button">
                <StIcon name="play" size={14} />
                {ctaContinue}
              </StButton>
            </Link>
            <StButton
              variant="ghost"
              size="md"
              type="button"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FBF3E2',
                borderColor: 'rgba(244,201,154,0.4)',
              }}
            >
              <StIcon name="calendar" size={14} color="#F4C99A" />
              {ctaPlan}
            </StButton>
          </div>
        </div>
        <div
          className="hidden min-w-[130px] rounded-2xl border p-3 text-center sm:block"
          style={{
            background: 'rgba(42,24,16,0.4)',
            borderColor: '#D4A24C',
          }}
        >
          <StSoyomboFlame size={28} color="#D4A24C" />
          <p className="mt-1 font-display text-3xl font-bold" style={{ color: '#FBF3E2' }}>
            23
          </p>
          <p className="text-[10px] tracking-[0.1em]" style={{ color: '#F4C99A' }}>
            {streakLabel}
          </p>
        </div>
      </div>
      <div className="-mx-7 -mb-7 mt-5">
        <StMeander tone="ember" height={12} />
      </div>
    </StCard>
  );
}

function ContinueLessonsCard({
  eyebrow,
  title,
  allLabel,
  minutesFmt,
}: {
  eyebrow: string;
  title: string;
  allLabel: string;
  minutesFmt: (n: number) => string;
}) {
  return (
    <StCard padding="md">
      <header className="flex items-start justify-between">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-1 font-display text-lg font-semibold"
            style={{ color: 'var(--st-soot)' }}
          >
            {title}
          </h2>
        </div>
        <Link
          href="/ai-tutor"
          className="text-xs font-semibold"
          style={{ color: 'var(--st-ember)' }}
        >
          {allLabel}
        </Link>
      </header>
      <ul className="mt-3 flex flex-col">
        {SAMPLE_LESSONS.map((l, i) => (
          <li
            key={l.title}
            className="flex items-center gap-3 py-2.5"
            style={
              i < SAMPLE_LESSONS.length - 1
                ? { borderBottom: '1px solid rgba(185,132,56,0.18)' }
                : {}
            }
          >
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border"
              style={{
                background: 'var(--st-felt)',
                borderColor: 'rgba(185, 132, 56, 0.4)',
              }}
            >
              <StSubjectGlyph subject={l.subject} size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--st-ink)' }}>
                {l.title}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                {l.meta}
              </p>
              <div className="mt-1.5">
                <StProgress value={l.progress} height={5} />
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-bold" style={{ color: 'var(--st-ink)' }}>
                {l.progress}%
              </p>
              <p className="text-[10px]" style={{ color: 'var(--st-ink-3)' }}>
                {minutesFmt(l.minutesLeft)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </StCard>
  );
}

function MasteryCard({
  eyebrow,
  title,
  emptyLabel,
  rows,
}: {
  eyebrow: string;
  title: string;
  emptyLabel: string;
  rows: MasteryRow[];
}) {
  return (
    <StCard padding="md">
      <p
        className="text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold" style={{ color: 'var(--st-soot)' }}>
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5" data-testid="home-mastery">
          {rows.slice(0, 6).map((r) => {
            const pct = Math.round(r.p_mastered * 100);
            const tint = levelTint(r.level);
            return (
              <li key={r.curriculum_strand}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--st-ink)' }}>
                    {r.curriculum_strand}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: tint }}>
                    {pct}%
                  </span>
                </div>
                <div className="mt-1">
                  <StProgress value={pct} height={6} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </StCard>
  );
}

function OlympiadsCard({
  eyebrow,
  title,
  addLabel,
  emptyLabel,
  daysLeftLabel,
  pendingLabel,
  paidLabel,
  registrations,
}: {
  eyebrow: string;
  title: string;
  addLabel: string;
  emptyLabel: string;
  daysLeftLabel: string;
  pendingLabel: string;
  paidLabel: string;
  registrations: RegistrationCard[];
}) {
  return (
    <StCard padding="md">
      <header className="flex items-start justify-between">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-1 font-display text-lg font-semibold"
            style={{ color: 'var(--st-soot)' }}
          >
            {title}
          </h2>
        </div>
        <Link
          href="/olympiad"
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
          style={{
            color: 'var(--st-ink-2)',
            borderColor: 'rgba(185, 132, 56, 0.4)',
          }}
        >
          <StIcon name="plus" size={10} />
          {addLabel}
        </Link>
      </header>
      {registrations.length === 0 ? (
        <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {emptyLabel}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {registrations.map((r) => {
            const days = daysUntil(r.exam_date);
            return (
              <article
                key={r.olympiad_id}
                className="relative rounded-xl border p-3"
                style={{
                  borderColor: 'rgba(185, 132, 56, 0.4)',
                  background: 'var(--st-paper)',
                }}
              >
                <header className="flex items-start justify-between gap-2">
                  <StChip tone="ember">{r.subject}</StChip>
                  <StChip tone={r.status === 'PAID' ? 'moss' : 'brass'}>
                    {r.status === 'PAID' ? paidLabel : pendingLabel}
                  </StChip>
                </header>
                <h3
                  className="mt-2 font-display text-sm font-bold leading-tight"
                  style={{ color: 'var(--st-soot)', minHeight: 34 }}
                >
                  {r.title}
                </h3>
                <footer className="mt-3 flex items-end justify-between">
                  <div>
                    <p
                      className="font-display text-2xl font-bold leading-none"
                      style={{ color: 'var(--st-ember)' }}
                    >
                      {days}
                    </p>
                    <p
                      className="mt-0.5 text-[9px] tracking-[0.1em]"
                      style={{ color: 'var(--st-ink-3)' }}
                    >
                      {daysLeftLabel}
                    </p>
                  </div>
                  <StIcon name="ticket" size={20} color="#8C5F22" />
                </footer>
                {r.aimag && (
                  <p
                    className="mt-2 flex items-center gap-1 text-[11px]"
                    style={{ color: 'var(--st-ink-3)' }}
                  >
                    <StIcon name="pin" size={11} color="#836340" />
                    {r.aimag}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </StCard>
  );
}

function PredictorCard({
  eyebrow,
  title,
  emptyLabel,
  ctaNew,
  ctaDetail,
  predictor,
  footer,
}: {
  eyebrow: string;
  title: string;
  emptyLabel: string;
  ctaNew: string;
  ctaDetail: string;
  predictor: PredictorResponse | null;
  footer: (sample: number, low: number, high: number) => string;
}) {
  return (
    <StCard variant="soot" padding="md">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: '#D4A24C' }}>
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-base font-semibold" style={{ color: '#FBF3E2' }}>
        {title}
      </h2>
      <div className="mt-3">
        {predictor && predictor.band ? (
          <PredictorBand predictor={predictor} />
        ) : (
          <p className="text-xs" style={{ color: '#D8BC85' }}>
            {emptyLabel}
          </p>
        )}
      </div>
      {predictor && predictor.band && (
        <p className="mt-1 text-[11px]" style={{ color: '#D8BC85' }}>
          {footer(
            predictor.sample_count,
            predictor.band.low * 4 + 400,
            predictor.band.high * 4 + 400,
          )}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Link href="/egsh" className="flex-1">
          <StButton variant="brass" size="sm" type="button" className="w-full">
            {ctaNew}
          </StButton>
        </Link>
        <Link href="/egsh" className="flex-1">
          <StButton
            variant="ghost"
            size="sm"
            type="button"
            className="w-full"
            style={{ color: '#D8BC85', borderColor: '#8C5F22' }}
          >
            {ctaDetail}
          </StButton>
        </Link>
      </div>
    </StCard>
  );
}

function TutorNudgeCard({
  label,
  sub,
  body,
  cta,
  quota,
}: {
  label: string;
  sub: string;
  body: string;
  cta: string;
  quota: string;
}) {
  return (
    <StCard padding="md" style={{ borderColor: 'var(--st-ember)', borderWidth: 1.5 }}>
      <header className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(135deg, var(--st-ember), #7E1D0A)',
            border: '1.5px solid var(--st-brass)',
          }}
        >
          <StSoyomboFlame size={16} color="#F4C99A" />
        </span>
        <div>
          <p className="font-display text-[13px] font-bold" style={{ color: 'var(--st-soot)' }}>
            {label}
          </p>
          <p className="text-[10px] tracking-[0.08em]" style={{ color: 'var(--st-ink-3)' }}>
            {sub}
          </p>
        </div>
      </header>
      <p className="mt-2 text-sm" style={{ color: 'var(--st-ink)' }}>
        {body}
      </p>
      <Link href="/ai-tutor" className="mt-3 block">
        <StButton variant="primary" size="md" type="button" className="w-full">
          <StIcon name="chat" size={14} />
          {cta}
        </StButton>
      </Link>
      <p className="mt-2 text-center text-[10px]" style={{ color: 'var(--st-ink-3)' }}>
        {quota}
      </p>
    </StCard>
  );
}

function PulseCard({
  title,
  anonymousLabel,
  body,
  cta,
}: {
  title: string;
  anonymousLabel: string;
  body: string;
  cta: string;
}) {
  return (
    <StCard
      padding="md"
      style={{ background: 'linear-gradient(180deg, var(--st-paper) 0%, #EFE0BF 100%)' }}
    >
      <header className="flex items-center gap-2">
        <StIcon name="heart" size={16} color="var(--st-ember)" />
        <p className="font-display text-sm font-semibold" style={{ color: 'var(--st-soot)' }}>
          {title}
        </p>
        <StChip tone="brass" className="ml-auto">
          {anonymousLabel}
        </StChip>
      </header>
      <p className="mt-2 text-xs" style={{ color: 'var(--st-ink-2)' }}>
        {body}
      </p>
      <StButton variant="secondary" size="sm" type="button" className="mt-2 w-full">
        {cta}
      </StButton>
    </StCard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function CornerBracket({ position }: { position: 'tl' | 'tr' }) {
  const isLeft = position === 'tl';
  return (
    <svg
      aria-hidden="true"
      className="absolute h-5 w-5"
      style={{
        top: 8,
        left: isLeft ? 8 : undefined,
        right: isLeft ? undefined : 8,
        transform: isLeft ? undefined : 'scaleX(-1)',
      }}
      viewBox="0 0 20 20"
      fill="none"
      stroke="#F4C99A"
      strokeWidth="1.5"
    >
      <path d="M2 8 L2 2 L8 2" />
    </svg>
  );
}

const MN_WEEKDAYS = ['НЯМ', 'ДАВАА', 'МЯГМАР', 'ЛХАГВА', 'ПҮРЭВ', 'БААСАН', 'БЯМБА'];
const MN_MONTHS = [
  '1 САР',
  '2 САР',
  '3 САР',
  '4 САР',
  '5 САР',
  '6 САР',
  '7 САР',
  '8 САР',
  '9 САР',
  '10 САР',
  '11 САР',
  '12 САР',
];

function formatMnDate(d: Date): string {
  const weekday = MN_WEEKDAYS[d.getDay()] ?? '';
  const month = MN_MONTHS[d.getMonth()] ?? '';
  return `${weekday} · ${month} ${d.getDate()}`;
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function levelTint(level: MasteryRow['level']): string {
  switch (level) {
    case 'MASTERED':
      return '#4a5630';
    case 'PROFICIENT':
      return '#5C6B3B';
    case 'DEVELOPING':
      return '#C28A1A';
    case 'INTRODUCED':
      return '#C2410C';
    case 'NOT_STARTED':
    default:
      return 'var(--st-ink-3)';
  }
}
