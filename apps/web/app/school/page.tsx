import { PersonaStub } from '@/components/system/PersonaStub';

/**
 * School-admin landing. SCHOOL_ADMIN login routes here. Real dashboard
 * (cohort rollups, bulk roster oversight, school-wide analytics) lands
 * in a later sprint — see docs/sprints/p1-roadmap.md.
 */
export default function SchoolHome() {
  return (
    <PersonaStub
      roleLabel="Сургуулийн админ"
      icon="flag"
      title="Сургуулийн самбар"
      subtitle="Сургуулийн хэмжээний тойм, багш нарын бүртгэл, олимпиадын оролцоо."
      features={[
        'Сургуулийн хэмжээний эзэмшлийн тойм',
        'Багш нарын бүртгэл, эрхийн удирдлага',
        'Олимпиадын бүлгийн бүртгэл, төлбөрийн хяналт',
        'ЭЕШ-ийн дүнгийн чиг хандлага',
      ]}
    />
  );
}
