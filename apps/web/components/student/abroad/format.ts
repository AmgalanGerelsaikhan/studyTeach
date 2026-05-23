/**
 * Format a Date as Mongolian long-form ("2027 оны 01 сарын 15").
 * Months and days are zero-padded so they line up in lists; year is taken
 * verbatim. UTC fields are used so the string is server/client-stable
 * (CLAUDE.md hard constraint #11 — verify the render: hydration must match).
 */
export function formatMongolianDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y} оны ${m} сарын ${d}`;
}

/**
 * Whole days between `date` and "today" at UTC midnight. Positive if `date`
 * is in the future, zero on the same day, negative once it has passed.
 */
export function daysUntil(date: Date): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
