/* =============================================================================
   format.ts — localized date formatting built on top of a dictionary.
   ============================================================================= */

import { parse } from "../domain/dates";
import type { Lang } from "../domain/types";
import type { Dict } from "./es";

export function weekday(d: Dict, str: string): string {
  return d.weekdays[parse(str).getDay()];
}

export function longDate(d: Dict, str: string, lang: Lang): string {
  const dt = parse(str);
  const wd = d.weekdays[dt.getDay()];
  const day = dt.getDate();
  const mon = d.months[dt.getMonth()];
  return lang === "es" ? `${wd} ${day} de ${mon}` : `${wd}, ${mon} ${day}`;
}

export function shortDate(d: Dict, str: string, lang: Lang): string {
  const dt = parse(str);
  const mon = d.months[dt.getMonth()].slice(0, 3);
  const day = dt.getDate();
  return lang === "es" ? `${day} ${mon.toLowerCase()}` : `${mon} ${day}`;
}

export function monthLabel(d: Dict, y: number, m: number): string {
  return `${d.months[m]} ${y}`;
}
