/* =============================================================================
   dates.ts — date helpers, ALWAYS in LOCAL time.
   All dates are handled as "YYYY-MM-DD" strings in local time so that "today"
   doesn't shift across timezones (the classic bug when using toISOString/UTC).
   Localized weekday/month names and formatting live in the i18n layer.
   ============================================================================= */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" for a date (defaults to today), in local time. */
export function dateStr(d: Date = new Date()): string {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

export function todayStr(): string {
  return dateStr(new Date());
}

/** "YYYY-MM-DD" -> local Date (at midnight). */
export function parse(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(str: string, n: number): string {
  const d = parse(str);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

/** Whole-day difference (a - b); positive when a is later. */
export function diffDays(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000);
}

export function isFuture(str: string): boolean {
  return diffDays(str, todayStr()) > 0;
}

/** Last N days ending at `endStr` (inclusive), oldest to newest. */
export function lastNDays(endStr: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endStr, -i));
  return out;
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
