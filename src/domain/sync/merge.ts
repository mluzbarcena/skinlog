/* =============================================================================
   merge.ts — pure, framework-agnostic reconciliation of two AppStates.

   Cross-device sync uses last-writer-wins PER KEY (never whole-document), so two
   devices that edited different days offline both keep their changes:
     - Each calendar day carries an edit clock (meta.dayUpdatedAt) and/or a
       deletion clock (meta.deletedDays, a tombstone). The larger of the two wins;
       ties keep the day alive (conservative — we don't lose data on equal ms).
     - `settings` is small and rarely edited, so it is resolved whole by the
       larger meta.settingsUpdatedAt.
   Legacy days with no clock (pre-v3, ts 0) survive: a 0 edit clock still beats an
   absent tombstone, so migrated history is never dropped on first sync.
   ============================================================================= */

import { SCHEMA_VERSION } from "../config";
import type { AppState } from "../types";

const ts = (m: Record<string, number>, k: string): number => m[k] ?? 0;

/** Merges two states into one, resolving conflicts per key. Commutative & idempotent. */
export function mergeStates(a: AppState, b: AppState): AppState {
  const dates = new Set<string>([
    ...Object.keys(a.days),
    ...Object.keys(b.days),
    ...Object.keys(a.meta.deletedDays),
    ...Object.keys(b.meta.deletedDays),
  ]);

  const days: AppState["days"] = {};
  const dayUpdatedAt: Record<string, number> = {};
  const deletedDays: Record<string, number> = {};

  for (const date of dates) {
    const editTs = Math.max(ts(a.meta.dayUpdatedAt, date), ts(b.meta.dayUpdatedAt, date));
    const delTs = Math.max(ts(a.meta.deletedDays, date), ts(b.meta.deletedDays, date));

    if (delTs > editTs) {
      deletedDays[date] = delTs;
      continue;
    }
    // Alive: take the record from the side with the newer edit clock, falling
    // back to whichever side actually holds the day.
    const preferA = ts(a.meta.dayUpdatedAt, date) >= ts(b.meta.dayUpdatedAt, date);
    const record = (preferA ? a.days[date] : b.days[date]) ?? a.days[date] ?? b.days[date];
    if (!record) continue; // no clock and no record anywhere — nothing to keep
    days[date] = record;
    if (editTs > 0) dayUpdatedAt[date] = editTs;
  }

  const settingsFromA = a.meta.settingsUpdatedAt >= b.meta.settingsUpdatedAt;
  return {
    version: SCHEMA_VERSION,
    settings: settingsFromA ? a.settings : b.settings,
    days,
    meta: {
      dayUpdatedAt,
      deletedDays,
      settingsUpdatedAt: Math.max(a.meta.settingsUpdatedAt, b.meta.settingsUpdatedAt),
    },
  };
}
