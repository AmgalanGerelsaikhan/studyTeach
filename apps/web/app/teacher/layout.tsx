import type { ReactNode } from 'react';

import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <TeacherSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
