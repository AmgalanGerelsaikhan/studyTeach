import type { ReactNode } from 'react';

import { StudentMobileNav } from '@/components/student/StudentMobileNav';
import { StudentTopBar } from '@/components/student/StudentTopBar';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <StudentMobileNav />
      <StudentTopBar />
      {children}
    </div>
  );
}
