import type { ReactNode } from 'react';

import { TeacherMobileBar } from '@/components/teacher/TeacherMobileBar';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <TeacherMobileBar />
      <TeacherSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
