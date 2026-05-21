'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AnalyticsResponse, TrendPoint } from '@studyteach/contracts';

import { StCard, StChip } from '@/components/st';
import { fetchAnalytics, fetchStudentRecent } from '@/lib/api/analytics';

const SUBJECTS = [
  { value: 'physics', label: 'Физик' },
  { value: 'math', label: 'Математик' },
  { value: 'mongolian', label: 'Монгол хэл' },
];
const GRADES = [9, 10, 11, 12] as const;

/**
 * Mirrors `studyTeach (2)/teacher.jsx:93 → TeacherDashboard`.
 *
 * Three cards stacked: cohort metrics, mastery matrix (student × strand
 * grid coloured by level), 8-week trend chart. Filter row: subject ×
 * grade. Cohort floor of 5 students before rendering the matrix.
 */
export function TeacherDashboard() {
  const t = useTranslations('teacher.dashboard');
  const [subject, setSubject] = useState('physics');
  const [grade, setGrade] = useState<number>(11);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [hoverStudentId, setHoverStudentId] = useState<number | null>(null);
  const [hoverRecent, setHoverRecent] = useState<{ score: number; submitted_at: string }[] | null>(
    null,
  );

  useEffect(() => {
    fetchAnalytics(subject, grade)
      .then(setData)
      .catch(() => setData(null));
  }, [subject, grade]);

  const onHoverStudent = useCallback((studentId: number) => {
    setHoverStudentId(studentId);
    fetchStudentRecent(studentId)
      .then(setHoverRecent)
      .catch(() => setHoverRecent([]));
  }, []);

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6" data-testid="teacher-dashboard-loading">
        <StCard padding="md">
          <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
            Уншиж байна…
          </p>
        </StCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6" data-testid="teacher-dashboard">
      {/* Filter row + cohort summary */}
      <StCard padding="md">
        <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('cohortEyebrow')}
            </p>
            <h1 className="mt-1 font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
              {t('cohortLabel', { n: data.cohort_size })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Selector
              label={t('filterSubject')}
              value={subject}
              onChange={setSubject}
              options={SUBJECTS.map((s) => ({ value: s.value, label: s.label }))}
            />
            <Selector
              label={t('filterGrade')}
              value={grade.toString()}
              onChange={(v) => setGrade(Number(v))}
              options={GRADES.map((g) => ({ value: g.toString(), label: `${g}-р анги` }))}
            />
          </div>
        </header>
      </StCard>

      {/* Mastery matrix or suppressed notice */}
      <StCard padding="md" className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('matrixEyebrow')}
        </p>
        {data.suppressed ? (
          <p
            className="mt-3 rounded-st-md border p-3 text-xs"
            style={{
              borderColor: 'rgba(194, 65, 12, 0.3)',
              background: 'rgba(194, 65, 12, 0.05)',
              color: 'var(--st-cinnabar)',
            }}
            data-testid="matrix-suppressed"
          >
            {t('matrixSuppressed', { n: data.cohort_size })}
          </p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-[11px]" data-testid="matrix-table">
                <thead>
                  <tr>
                    <th
                      className="px-2 py-1 font-bold uppercase tracking-[0.1em]"
                      style={{ color: 'var(--st-brass-dark)' }}
                    >
                      {t('studentColumn')}
                    </th>
                    {data.strands.map((s) => (
                      <th
                        key={s}
                        className="px-2 py-1 font-bold uppercase tracking-[0.1em] text-center"
                        style={{ color: 'var(--st-brass-dark)' }}
                      >
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr
                      key={row.student_id}
                      onMouseEnter={() => onHoverStudent(row.student_id)}
                      onMouseLeave={() => {
                        setHoverStudentId(null);
                        setHoverRecent(null);
                      }}
                      onClick={() => onHoverStudent(row.student_id)}
                      style={{ borderTop: '1px solid rgba(185, 132, 56, 0.15)' }}
                    >
                      <td
                        className="sticky left-0 px-2 py-2 truncate"
                        style={{
                          color: 'var(--st-ink)',
                          maxWidth: 160,
                          background: 'var(--st-paper)',
                        }}
                      >
                        {row.display_name}
                      </td>
                      {row.cells.map((c) => (
                        <td
                          key={c.strand}
                          className="px-1 py-1.5 text-center"
                          data-testid={`cell-${row.student_id}-${c.strand}`}
                          style={{
                            background: levelColour(c.level),
                            color: c.level && c.level >= 4 ? '#FBF3E2' : 'var(--st-ink)',
                          }}
                        >
                          {c.level ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Legend t={t} />
            {hoverStudentId && hoverRecent && (
              <p
                className="mt-3 text-xs"
                style={{ color: 'var(--st-ink-2)' }}
                data-testid="hover-recent"
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: 'var(--st-brass-dark)' }}
                >
                  {t('hoverRecent')}:{' '}
                </span>
                {hoverRecent.length === 0
                  ? t('noScores')
                  : hoverRecent
                      .map((r) => `${r.score} (${r.submitted_at.slice(0, 10)})`)
                      .join(' · ')}
              </p>
            )}
          </>
        )}
      </StCard>

      {/* 8-week trend */}
      {!data.suppressed && (
        <StCard padding="md" className="mt-4">
          <header className="flex items-center justify-between">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('trendEyebrow')}
            </p>
            <div
              className="flex items-center gap-3 text-[11px]"
              style={{ color: 'var(--st-ink-3)' }}
            >
              <LegendDot color="#C2410C" label={t('trendClass')} />
              <LegendDot color="#3E5F73" label={t('trendNation')} dashed />
            </div>
          </header>
          <TrendChart points={data.trend} />
        </StCard>
      )}
    </main>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-st-sm border px-2 py-1 text-sm"
        style={{
          borderColor: 'rgba(185, 132, 56, 0.4)',
          background: 'var(--st-paper)',
          color: 'var(--st-ink)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Legend({ t }: { t: (k: string) => string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3" data-testid="matrix-legend">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('levelLegend')}
      </span>
      {[1, 2, 3, 4, 5].map((lvl) => (
        <StChip key={lvl}>
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: levelColour(lvl as 1 | 2 | 3 | 4 | 5) }}
          />
          {t(`level${lvl}`)}
        </StChip>
      ))}
    </div>
  );
}

function levelColour(level: number | null): string {
  switch (level) {
    case 1:
      return '#F2D8C2';
    case 2:
      return '#E8B98C';
    case 3:
      return '#D4A24C';
    case 4:
      return '#7E5A24';
    case 5:
      return '#3D2B15';
    default:
      return 'var(--st-paper)';
  }
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-0.5 w-4"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return null;
  }
  const W = 640;
  const H = 120;
  const PAD = 16;
  const xs = points.map((_, i) => PAD + (i / (points.length - 1 || 1)) * (W - 2 * PAD));
  const allValues = points.flatMap((p) =>
    [p.class_avg, p.national_avg].filter((v): v is number => v !== null),
  );
  const maxV = allValues.length > 0 ? Math.max(...allValues) : 100;
  const minV = allValues.length > 0 ? Math.min(...allValues) : 0;
  const range = maxV - minV || 1;
  const y = (v: number | null) =>
    v === null ? null : H - PAD - ((v - minV) / range) * (H - 2 * PAD);
  const path = (key: 'class_avg' | 'national_avg') => {
    const segments: string[] = [];
    let opened = false;
    for (let i = 0; i < points.length; i++) {
      const yv = y(points[i]![key]);
      if (yv === null) {
        opened = false;
        continue;
      }
      segments.push(`${opened ? 'L' : 'M'}${xs[i]!} ${yv}`);
      opened = true;
    }
    return segments.join(' ');
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block h-[120px] w-full">
      <path
        d={path('national_avg')}
        stroke="#3E5F73"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        fill="none"
      />
      <path
        d={path('class_avg')}
        stroke="#C2410C"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {points.map((p, i) => {
        const yv = y(p.class_avg);
        return yv === null ? null : (
          <circle key={p.week_iso} cx={xs[i]!} cy={yv} r="3" fill="#C2410C" />
        );
      })}
    </svg>
  );
}
