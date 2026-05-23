import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { PortableStudentRecord, PsrAccessGrant, PsrAuditEntry } from '@studyteach/contracts';

import {
  StCard,
  StChip,
  StCornerBracket,
  StDivider,
  StIcon,
  StMeander,
  StSoyomboFlame,
  StUlzii,
} from '@/components/st';
import { GrantAccessForm } from '@/components/student/psr/GrantAccessForm';
import { RevokeGrantButton } from '@/components/student/psr/RevokeGrantButton';
import { getOwnPsrAuditServer, getOwnPsrGrantsServer, getOwnPsrServer } from '@/lib/api/psr';

/**
 * Student-facing Portable Student Record (PRD §4.9).
 *
 * Server component: fetches /psr/me, /psr/me/audit, and /psr/me/grants in
 * parallel with the HttpOnly session cookie forwarded (CLAUDE.md constraint
 * #8). The owner sees their identity, grades, olympiad participation,
 * teacher-CPD (if dual-profile), the list of schools they have granted
 * read-access to, the grant-issuing form, and the audit timeline of who
 * has read their record.
 *
 * Mobile-first 390×844: every section is a separate StCard so a narrow
 * viewport scrolls one block at a time. All copy lives in mn-Cyrl messages.
 */
export const dynamic = 'force-dynamic';

export default async function StudentPsrPage() {
  const cookieHeader = cookies().toString();
  const t = await getTranslations('student.psr');

  let record: PortableStudentRecord | null = null;
  let audit: PsrAuditEntry[] = [];
  let grants: PsrAccessGrant[] = [];
  let loadError = false;

  try {
    const [r, a, g] = await Promise.all([
      getOwnPsrServer(cookieHeader),
      getOwnPsrAuditServer(cookieHeader),
      getOwnPsrGrantsServer(cookieHeader),
    ]);
    record = r;
    audit = a.items;
    grants = g.items;
  } catch {
    loadError = true;
  }

  if (loadError || !record) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="lg">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  const sortedAudit = [...audit].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
  const sortedGrants = [...grants].sort(
    (a, b) => new Date(b.granted_at).getTime() - new Date(a.granted_at).getTime(),
  );

  return (
    <main
      className="st-stagger mx-auto flex max-w-3xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6"
      data-testid="student-psr"
    >
      <HeroCard t={t} />
      <StMeander tone="brass" height={6} />
      <IdentityCard t={t} identity={record.identity} />
      <GradesCard t={t} grades={record.grades} />
      <OlympiadsCard t={t} olympiads={record.olympiads} />
      <CpdCard t={t} cpd={record.teacher_cpd} />
      <GrantsCard t={t} grants={sortedGrants} />
      <GrantFormCard t={t} />
      <AuditCard t={t} audit={sortedAudit} />
    </main>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

type T = (key: string, vars?: Record<string, string | number>) => string;

function HeroCard({ t }: { t: T }) {
  return (
    <StCard padding="lg">
      <StCornerBracket corner="tl" />
      <StCornerBracket corner="tr" />
      <StCornerBracket corner="bl" />
      <StCornerBracket corner="br" />
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('eyebrow')}
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('title')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('subtitle')}
          </p>
        </div>
        <div className="shrink-0">
          <StSoyomboFlame size={44} />
        </div>
      </div>
    </StCard>
  );
}

function IdentityCard({ t, identity }: { t: T; identity: PortableStudentRecord['identity'] }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="identity.title" icon="user" />
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <StUlzii size={28} color="var(--st-brass-bright)" />
          <p className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            {identity.display_name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span style={{ color: 'var(--st-ink-2)' }}>{t('identity.schoolLabel')}</span>
          <span className="font-semibold" style={{ color: 'var(--st-ink)' }}>
            {identity.current_school_name ?? t('identity.unknownSchool')}
          </span>
          {identity.current_school_code && (
            <StChip tone="brass">{identity.current_school_code}</StChip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span style={{ color: 'var(--st-ink-2)' }}>{t('identity.gradeLabel')}</span>
          {identity.grade !== null ? (
            <StChip tone="sky">{t('identity.gradeValue', { n: identity.grade })}</StChip>
          ) : (
            <span style={{ color: 'var(--st-ink-3)' }}>{t('identity.unknownGrade')}</span>
          )}
          {identity.is_boarding && <StChip tone="moss">{t('identity.boardingChip')}</StChip>}
        </div>
      </div>
    </StCard>
  );
}

function GradesCard({ t, grades }: { t: T; grades: PortableStudentRecord['grades'] }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="grades.title" icon="chart" />
      {grades.length === 0 ? (
        <EmptyLine t={t} keyName="grades.empty" />
      ) : (
        <ul className="mt-3 flex flex-col">
          {grades.map((g, i) => (
            <li key={g.test_id}>
              <div className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--st-soot)' }}>
                      {g.subject}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ color: 'var(--st-ink-3)' }}
                    >
                      <StChip tone="default">{testTypeLabel(g.test_type, t)}</StChip>
                      <time dateTime={g.taken_at}>{formatDate(g.taken_at)}</time>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-display text-base font-bold"
                      style={{ color: 'var(--st-soot)' }}
                    >
                      {t('grades.scoreFormat', { score: g.score, max: g.max_score })}
                    </p>
                    {g.percentile !== null && (
                      <p className="text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                        {t('grades.percentileLabel', { n: Math.round(g.percentile) })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {i < grades.length - 1 && <StDivider />}
            </li>
          ))}
        </ul>
      )}
    </StCard>
  );
}

function OlympiadsCard({ t, olympiads }: { t: T; olympiads: PortableStudentRecord['olympiads'] }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="olympiads.title" icon="trophy" />
      {olympiads.length === 0 ? (
        <EmptyLine t={t} keyName="olympiads.empty" />
      ) : (
        <ul className="mt-3 flex flex-col">
          {olympiads.map((o, i) => (
            <li key={o.registration_id}>
              <div className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--st-soot)' }}>
                      {o.title}
                    </p>
                    <p className="mt-0.5 text-[12px]" style={{ color: 'var(--st-ink-2)' }}>
                      {o.organizer}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                      <time dateTime={o.exam_date}>{formatDate(o.exam_date)}</time>
                    </p>
                  </div>
                  <StChip tone={paymentTone(o.payment_status)}>
                    {paymentLabel(o.payment_status, t)}
                  </StChip>
                </div>
              </div>
              {i < olympiads.length - 1 && <StDivider />}
            </li>
          ))}
        </ul>
      )}
    </StCard>
  );
}

function CpdCard({ t, cpd }: { t: T; cpd: PortableStudentRecord['teacher_cpd'] }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="cpd.title" icon="award" />
      {cpd.length === 0 ? (
        <EmptyLine t={t} keyName="cpd.empty" />
      ) : (
        <ul className="mt-3 flex flex-col">
          {cpd.map((c, i) => (
            <li key={c.certification_id}>
              <div className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--st-soot)' }}>
                      {c.course_title}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ color: 'var(--st-ink-3)' }}
                    >
                      <StChip tone="brass">{t('cpd.creditsFormat', { n: c.cpd_credits })}</StChip>
                      {c.moe_endorsed && <StChip tone="moss">{t('cpd.moeEndorsed')}</StChip>}
                      <time dateTime={c.issued_at}>{formatDate(c.issued_at)}</time>
                    </div>
                  </div>
                </div>
              </div>
              {i < cpd.length - 1 && <StDivider />}
            </li>
          ))}
        </ul>
      )}
    </StCard>
  );
}

function GrantsCard({ t, grants }: { t: T; grants: PsrAccessGrant[] }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="grants.title" icon="shield" />
      {grants.length === 0 ? (
        <EmptyLine t={t} keyName="grants.empty" />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-[12px]">
            <thead>
              <tr
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--st-brass-dark)' }}
              >
                <th className="pb-2">{t('grants.schoolColumn')}</th>
                <th className="pb-2">{t('grants.dateColumn')}</th>
                <th className="pb-2">{t('grants.statusColumn')}</th>
                <th className="pb-2 text-right">{t('grants.actionColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((g) => {
                const active = g.revoked_at === null;
                return (
                  <tr
                    key={g.grant_id}
                    className="border-t"
                    style={{ borderColor: 'rgba(185,132,56,0.25)' }}
                  >
                    <td
                      className="py-2 pr-2 align-middle font-semibold"
                      style={{ color: 'var(--st-ink)' }}
                    >
                      {g.grantee_school_code}
                    </td>
                    <td className="py-2 pr-2 align-middle" style={{ color: 'var(--st-ink-2)' }}>
                      <time dateTime={g.granted_at}>{formatDate(g.granted_at)}</time>
                    </td>
                    <td className="py-2 pr-2 align-middle">
                      <StChip tone={active ? 'moss' : 'default'}>
                        {active ? t('grants.statusActive') : t('grants.statusRevoked')}
                      </StChip>
                    </td>
                    <td className="py-2 text-right align-middle">
                      {active && (
                        <RevokeGrantButton
                          grantId={g.grant_id}
                          granteeSchoolCode={g.grantee_school_code}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </StCard>
  );
}

function GrantFormCard({ t }: { t: T }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="grantForm.title" icon="plus" />
      <p className="mt-1 mb-3 text-[12px]" style={{ color: 'var(--st-ink-2)' }}>
        {t('grantForm.subtitle')}
      </p>
      <GrantAccessForm />
    </StCard>
  );
}

function AuditCard({ t, audit }: { t: T; audit: PsrAuditEntry[] }) {
  return (
    <StCard padding="md">
      <SectionHeader t={t} keyName="audit.title" icon="eye" />
      {audit.length === 0 ? (
        <EmptyLine t={t} keyName="audit.empty" />
      ) : (
        <ul className="mt-3 flex flex-col">
          {audit.map((entry, i) => (
            <li key={`${entry.occurred_at}-${i}`}>
              <div className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--st-soot)' }}>
                      {auditActionLabel(entry.action, t)}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ color: 'var(--st-ink-3)' }}
                    >
                      <StChip tone={readerTone(entry.reader_role)}>
                        {readerRoleLabel(entry.reader_role, t)}
                      </StChip>
                      <span>{entry.reader_organization_code ?? t('audit.unknownReader')}</span>
                    </div>
                    {entry.reason && (
                      <p className="mt-1 text-[11px]" style={{ color: 'var(--st-ink-2)' }}>
                        {t('audit.reasonPrefix')} {entry.reason}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={entry.occurred_at}
                    className="whitespace-nowrap text-[11px]"
                    style={{ color: 'var(--st-ink-3)' }}
                  >
                    {formatTimestamp(entry.occurred_at)}
                  </time>
                </div>
              </div>
              {i < audit.length - 1 && <StDivider />}
            </li>
          ))}
        </ul>
      )}
    </StCard>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({
  t,
  keyName,
  icon,
}: {
  t: T;
  keyName: string;
  icon: 'user' | 'chart' | 'trophy' | 'award' | 'shield' | 'plus' | 'eye';
}) {
  return (
    <div className="flex items-center gap-2">
      <StIcon name={icon} size={14} color="#8c5f22" />
      <h2
        className="text-[11px] font-bold uppercase tracking-[0.14em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t(keyName)}
      </h2>
    </div>
  );
}

function EmptyLine({ t, keyName }: { t: T; keyName: string }) {
  return (
    <p className="mt-3 text-[13px]" style={{ color: 'var(--st-ink-3)' }}>
      {t(keyName)}
    </p>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} · ${hh}:${mi}`;
}

// Backend may emit test types that have not yet been translated. Fall back
// to the raw key so the gap is visible in dev rather than silently swallowed.
function testTypeLabel(type: string, t: T): string {
  const key = `testType.${type.toUpperCase()}`;
  try {
    const label = t(key);
    // next-intl returns the key string when the path is missing. Detect that.
    if (label === key || label.startsWith('student.psr.testType.')) {
      return type;
    }
    return label;
  } catch {
    return type;
  }
}

function paymentTone(status: string): 'ember' | 'brass' | 'moss' | 'sky' | 'soot' | 'default' {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'moss';
    case 'pending':
      return 'brass';
    case 'failed':
    case 'cancelled':
      return 'ember';
    default:
      return 'default';
  }
}

function paymentLabel(status: string, t: T): string {
  const key = `olympiads.payment.${status.toLowerCase()}`;
  try {
    const label = t(key);
    if (label === key || label.startsWith('student.psr.olympiads.payment.')) {
      return status;
    }
    return label;
  } catch {
    return status;
  }
}

// Map raw backend audit actions → i18n keys. Mirrors apps/web/app/parent/audit.
const AUDIT_ACTION_KEY: Record<string, string> = {
  'psr.read': 'psrRead',
  'psr.grant.created': 'grantCreated',
  'psr.grant.revoked': 'grantRevoked',
};

function auditActionLabel(action: string, t: T): string {
  const sub = AUDIT_ACTION_KEY[action];
  if (!sub) return action;
  try {
    return t(`audit.actions.${sub}`);
  } catch {
    return action;
  }
}

function readerRoleLabel(role: string, t: T): string {
  switch (role) {
    case 'STUDENT':
      return t('audit.roles.student');
    case 'TEACHER':
      return t('audit.roles.teacher');
    case 'PARENT':
      return t('audit.roles.parent');
    case 'SCHOOL_ADMIN':
      return t('audit.roles.schoolAdmin');
    case 'PLATFORM_ADMIN':
      return t('audit.roles.platformAdmin');
    case 'SYSTEM':
      return t('audit.roles.system');
    default:
      return role;
  }
}

function readerTone(role: string): 'ember' | 'brass' | 'sky' | 'moss' | 'soot' | 'default' {
  switch (role) {
    case 'STUDENT':
      return 'ember';
    case 'TEACHER':
      return 'moss';
    case 'PARENT':
      return 'brass';
    case 'SCHOOL_ADMIN':
      return 'sky';
    case 'PLATFORM_ADMIN':
      return 'soot';
    case 'SYSTEM':
      return 'default';
    default:
      return 'default';
  }
}
