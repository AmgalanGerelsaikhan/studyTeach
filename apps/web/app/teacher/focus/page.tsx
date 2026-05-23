import { FocusCreatePanel } from '@/components/teacher/focus/FocusCreatePanel';

/**
 * Teacher Focus Mode entry (E-039 / PRD §4.6).
 *
 * The page shell is a server component (lightweight bytes shipped to 3G).
 * All interactive state — form, hero card, 5s live-count poll, close-out —
 * lives in the FocusCreatePanel client island.
 */
export const dynamic = 'force-dynamic';

export default function TeacherFocusPage() {
  return (
    <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6" data-testid="teacher-focus-page">
      <FocusCreatePanel />
    </main>
  );
}
