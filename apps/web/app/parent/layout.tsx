import type { ReactNode } from 'react';

import { ParentChrome } from '@/components/parent/ParentChrome';

export default function ParentLayout({ children }: { children: ReactNode }) {
  return <ParentChrome>{children}</ParentChrome>;
}
