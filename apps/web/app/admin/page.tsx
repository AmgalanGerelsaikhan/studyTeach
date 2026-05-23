import { PersonaStub } from '@/components/system/PersonaStub';

/**
 * Platform-admin landing. PLATFORM_ADMIN login routes here. Real console
 * (multi-tenant oversight, audit-log review, equity dashboards) lands in
 * a later sprint — see docs/sprints/p1-roadmap.md.
 */
export default function AdminHome() {
  return (
    <PersonaStub
      roleLabel="Системийн захиргаа"
      icon="shield"
      title="Захиргааны самбар"
      subtitle="Олон түрээслэгчийн хяналт, аудит бүртгэл, тэгш байдлын самбар."
      features={[
        'Олон түрээслэгчийн хяналт, байгууллагын удирдлага',
        'Аудит бүртгэлийн хяналт (өөрчилшгүй)',
        'Улсын хэмжээний тэгш байдлын самбар',
        'Хэрэглэгч, эрхийн удирдлага',
      ]}
    />
  );
}
