import type { ReactNode } from 'react';

import { StudentTopBar } from '@/components/student/StudentTopBar';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <StudentTopBar />
      {children}
    </div>
  );
}
