import { StCard, StIcon } from '@/components/st';

/**
 * Platform-admin landing. PLATFORM_ADMIN login routes here. Real console
 * (multi-tenant oversight, audit-log review, equity dashboards) lands in
 * a later sprint — see docs/ROLLOUT_PLAN.md.
 *
 * The persona chrome (sidebar + mobile drawer + logout) lives in
 * app/admin/layout.tsx; this page renders content only.
 */
export default function AdminHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <StCard variant="soot" padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#D4A24C' }}
        >
          Системийн захиргаа
        </p>
        <h1
          className="mt-2 font-display text-2xl font-bold sm:text-3xl"
          style={{ color: '#FBF3E2' }}
        >
          Захиргааны самбар
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#D8BC85' }}>
          Олон түрээслэгчийн хяналт, аудит бүртгэл, тэгш байдлын самбар.
        </p>
      </StCard>

      <StCard padding="md" className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          Удахгүй
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {[
            'Олон түрээслэгчийн хяналт, байгууллагын удирдлага',
            'Аудит бүртгэлийн хяналт (өөрчилшгүй)',
            'Улсын хэмжээний тэгш байдлын самбар',
            'Хэрэглэгч, эрхийн удирдлага',
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">
                <StIcon name="clock" size={13} color="var(--st-brass)" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </StCard>
    </main>
  );
}
