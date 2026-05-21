'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import type {
  OlympiadCard,
  RosterCommitResponse,
  RosterRow,
  RosterUploadResponse,
} from '@studyteach/contracts';

import { StButton, StCard, StChip, StDivider, StIcon } from '@/components/st';
import { listOlympiads } from '@/lib/api/olympiad';
import { commitRoster, uploadRoster } from '@/lib/api/roster';

interface ParsedRow extends RosterRow {
  raw_row_index: number;
  parse_error: string | null;
}

/**
 * Mirrors `studyTeach (2)/teacher2.jsx:7 → BulkRoster`.
 *
 * Two-step UI: drop CSV → preview + per-row validation → choose olympiad +
 * commit. Submit is blocked until 0 parse errors.
 */
export function BulkRoster() {
  const t = useTranslations('teacher.roster');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploadResult, setUploadResult] = useState<RosterUploadResponse | null>(null);
  const [olympiads, setOlympiads] = useState<OlympiadCard[]>([]);
  const [olympiadId, setOlympiadId] = useState<number | ''>('');
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<RosterCommitResponse | null>(null);

  useEffect(() => {
    listOlympiads({ window: 'open', limit: 50 })
      .then((r) => setOlympiads(r.items))
      .catch(() => setOlympiads([]));
  }, []);

  const validCount = useMemo(() => rows.filter((r) => !r.parse_error).length, [rows]);
  const errorCount = rows.length - validCount;

  const handleFile = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      worker: false, // small fixtures; switch to true at 200+ rows
      complete: (result) => {
        const parsed = result.data.map<ParsedRow>((row, i) => {
          const full_name = (row['full_name'] ?? row['name'] ?? '').trim();
          const phone = (row['phone'] ?? row['phone_number'] ?? '').trim();
          const gradeRaw = (row['grade'] ?? '').trim();
          const grade = Number(gradeRaw);
          const national_id = (row['national_id'] ?? row['id'] ?? '').trim() || undefined;
          let error: string | null = null;
          if (!full_name) error = 'full_name required';
          else if (!/^\+976\d{8}$/.test(phone)) error = 'phone must be +976 + 8 digits';
          else if (!(grade >= 1 && grade <= 12)) error = 'grade must be 1–12';
          return {
            raw_row_index: i,
            full_name,
            phone_number: phone,
            ...(national_id ? { national_id } : {}),
            grade: Number.isFinite(grade) ? grade : 0,
            parse_error: error,
          };
        });
        setRows(parsed);
        setUploadResult(null);
        setCommitResult(null);
      },
    });
  }, []);

  const handleUpload = useCallback(async () => {
    const validRows: RosterRow[] = rows
      .filter((r) => !r.parse_error)
      .map(({ raw_row_index: _i, parse_error: _e, ...r }) => r);
    if (validRows.length === 0) return;
    try {
      const res = await uploadRoster(validRows);
      setUploadResult(res);
    } catch (e) {
      setUploadResult(null);
      console.error(e);
    }
  }, [rows]);

  const handleCommit = useCallback(async () => {
    if (!uploadResult || !olympiadId) return;
    setCommitting(true);
    try {
      const res = await commitRoster(uploadResult.roster_id, Number(olympiadId));
      setCommitResult(res);
    } finally {
      setCommitting(false);
    }
  }, [uploadResult, olympiadId]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6" data-testid="bulk-roster">
      <StCard padding="lg">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>

        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <label
            className="inline-flex cursor-pointer items-center gap-2 rounded-st-md border px-3 py-2"
            style={{
              borderColor: 'rgba(185, 132, 56, 0.4)',
              background: 'var(--st-paper-2)',
            }}
          >
            <StIcon name="upload" size={14} />
            <span className="text-sm font-semibold" style={{ color: 'var(--st-ink)' }}>
              {t('uploadCta')}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              data-testid="roster-file"
            />
          </label>
          {rows.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
              {t('noFileYet')}
            </p>
          ) : (
            <>
              <StChip tone="moss">{t('validRows', { n: validCount })}</StChip>
              {errorCount > 0 && <StChip tone="ember">{t('errorRows', { n: errorCount })}</StChip>}
            </>
          )}
        </div>

        {rows.length > 0 && (
          <>
            <StDivider />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr style={{ color: 'var(--st-brass-dark)' }}>
                    <th className="px-2 py-1 font-bold uppercase tracking-[0.12em]">
                      {t('headers.name')}
                    </th>
                    <th className="px-2 py-1 font-bold uppercase tracking-[0.12em]">
                      {t('headers.phone')}
                    </th>
                    <th className="px-2 py-1 font-bold uppercase tracking-[0.12em]">
                      {t('headers.natId')}
                    </th>
                    <th className="px-2 py-1 font-bold uppercase tracking-[0.12em]">
                      {t('headers.grade')}
                    </th>
                    <th className="px-2 py-1 font-bold uppercase tracking-[0.12em]">
                      {t('headers.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const commitRow = commitResult?.results[r.raw_row_index];
                    const status =
                      r.parse_error ?? commitRow?.error ?? (commitRow ? t('successRow') : '—');
                    const ok = !r.parse_error && (commitRow ? !commitRow.error : true);
                    return (
                      <tr
                        key={r.raw_row_index}
                        style={{ borderTop: '1px solid rgba(185, 132, 56, 0.18)' }}
                      >
                        <td className="px-2 py-1" style={{ color: 'var(--st-ink)' }}>
                          {r.full_name}
                        </td>
                        <td className="px-2 py-1 font-mono" style={{ color: 'var(--st-ink-2)' }}>
                          {r.phone_number}
                        </td>
                        <td className="px-2 py-1 font-mono" style={{ color: 'var(--st-ink-3)' }}>
                          {r.national_id ?? '—'}
                        </td>
                        <td className="px-2 py-1" style={{ color: 'var(--st-ink-2)' }}>
                          {r.grade}
                        </td>
                        <td
                          className="px-2 py-1"
                          style={{ color: ok ? 'var(--st-moss)' : 'var(--st-cinnabar)' }}
                          data-testid={`roster-row-${r.raw_row_index}`}
                        >
                          {status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <StDivider />

            <div className="flex flex-wrap items-center gap-3">
              {!uploadResult && (
                <StButton
                  type="button"
                  variant="brass"
                  size="sm"
                  disabled={errorCount > 0 || validCount === 0}
                  onClick={handleUpload}
                  data-testid="roster-upload"
                >
                  <StIcon name="check" size={12} />
                  {t('uploadCta')}
                </StButton>
              )}

              {uploadResult && !commitResult && (
                <>
                  <select
                    value={olympiadId}
                    onChange={(e) => setOlympiadId(Number(e.target.value))}
                    className="rounded-st-sm border px-2 py-1 text-sm"
                    style={{
                      borderColor: 'rgba(185, 132, 56, 0.4)',
                      background: 'var(--st-paper)',
                    }}
                    data-testid="roster-olympiad"
                  >
                    <option value="">{t('selectOlympiad')}</option>
                    {olympiads.map((o) => (
                      <option key={o.olympiad_id} value={o.olympiad_id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                  <StButton
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!olympiadId || committing}
                    onClick={handleCommit}
                    data-testid="roster-commit"
                  >
                    {committing ? t('committing') : t('commitCta')}
                  </StButton>
                </>
              )}

              {commitResult && (
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--st-moss)' }}
                  data-testid="roster-success"
                >
                  {t('successSummary', {
                    ok: commitResult.results.filter((r) => !r.error).length,
                    total: commitResult.results.length,
                    invoice: commitResult.invoice_id,
                  })}
                </p>
              )}
            </div>
          </>
        )}
      </StCard>
    </main>
  );
}
