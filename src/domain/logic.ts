/* =============================================================================
   logic.ts — all the "intelligence" of the app (pure functions over the state).
   No DOM, no globals: every function receives the AppState explicitly, which
   makes it trivially testable and safe to call from React render.
   ============================================================================= */

import {
  BRIGHTENING_STEP_ID,
  DEFAULT_TARGETS,
  IRRITATION_WARNING,
  NIGHT_TYPES_BY_PHASE,
} from "./config";
import { addDays, diffDays, isFuture, lastNDays, pct, todayStr } from "./dates";
import type {
  AmStatus,
  AppState,
  DayRecord,
  DayStatus,
  IrritationCheck,
  NightSuggestion,
  NightType,
  Phase,
  PmStatus,
  ProductId,
  RoutineStep,
  Stats,
} from "./types";

function getDay(state: AppState, dateStr: string): DayRecord | null {
  return state.days[dateStr] || null;
}

/** Set of product ids that currently exist in the catalog. */
function knownProductIds(state: AppState): Set<ProductId> {
  return new Set(state.settings.products.map((p) => p.id));
}

/** Visible name of a product id; falls back to the id if it was deleted. */
export function productName(state: AppState, id: ProductId): string {
  const p = state.settings.products.find((x) => x.id === id);
  return p ? p.name : id;
}

// --- PHASE -------------------------------------------------------------------
// Phase 1 until Hyalu B5 is finished.
// Phase 2 for dates >= hyaluFinishedDate (SANA unlocks from there).
export function phaseForDate(state: AppState, dateStr: string): Phase {
  const fin = state.settings.hyaluFinishedDate;
  if (!fin) return 1;
  return diffDays(dateStr, fin) >= 0 ? 2 : 1;
}

export function currentPhase(state: AppState): Phase {
  return phaseForDate(state, todayStr());
}

// --- TEMPLATES ---------------------------------------------------------------
// Read from the editable templates in settings. Steps referencing a product that
// no longer exists are filtered out (defensive against deletions).
// AM also hides the brightening step when disabled.
export function amSteps(state: AppState, dateStr: string): RoutineStep[] {
  const phase = phaseForDate(state, dateStr);
  const brighting = state.settings.brightingEnabled;
  const known = knownProductIds(state);
  return state.settings.routines[phase].am.filter(
    (s) => (s.id !== BRIGHTENING_STEP_ID || brighting) && known.has(s.id),
  );
}

export function pmSteps(state: AppState, dateStr: string, type: NightType | null): RoutineStep[] {
  if (!type || type === "none") return [];
  const phase = phaseForDate(state, dateStr);
  const steps = state.settings.routines[phase].pm[type];
  if (!steps) return [];
  const known = knownProductIds(state);
  return steps.filter((s) => known.has(s.id));
}

export function nightTypesFor(state: AppState, dateStr: string): NightType[] {
  return NIGHT_TYPES_BY_PHASE[phaseForDate(state, dateStr)];
}

// --- COMPLETENESS ------------------------------------------------------------
export function amStatus(state: AppState, dateStr: string): AmStatus {
  const d = getDay(state, dateStr);
  const steps = amSteps(state, dateStr);
  const required = steps.filter((s) => !s.optional);
  const done = d ? d.am?.done || {} : {};
  const doneRequired = required.filter((s) => done[s.id]).length;
  const doneOptional = steps.filter((s) => s.optional && done[s.id]).length;
  const skipped = !!(d && d.am && d.am.skipped);
  return {
    total: required.length,
    done: doneRequired,
    optionalDone: doneOptional,
    complete: !skipped && required.length > 0 && doneRequired === required.length,
    skipped,
    registered: skipped || doneRequired > 0 || doneOptional > 0,
  };
}

export function pmStatus(state: AppState, dateStr: string): PmStatus {
  const d = getDay(state, dateStr);
  const type = d && d.pm ? d.pm.type : null;
  const steps = pmSteps(state, dateStr, type);
  const required = steps.filter((s) => !s.optional);
  const done = d ? d.pm?.done || {} : {};
  const doneRequired = required.filter((s) => done[s.id]).length;
  const isRealRoutine = !!type && type !== "none";
  return {
    type: type || null,
    total: required.length,
    done: doneRequired,
    isRealRoutine,
    noRoutine: type === "none",
    complete: isRealRoutine && required.length > 0 && doneRequired === required.length,
    registered: !!type || doneRequired > 0,
  };
}

// Summarized status of a day (used by calendar, today, stats, CSV).
export function dayStatus(state: AppState, dateStr: string): DayStatus {
  const am = amStatus(state, dateStr);
  const pm = pmStatus(state, dateStr);
  const d = getDay(state, dateStr);
  return {
    date: dateStr,
    phase: phaseForDate(state, dateStr),
    am,
    pm,
    tolerance: d ? d.tolerance : null,
    note: d ? d.note : "",
    registered: !!(
      am.registered ||
      pm.registered ||
      (d && d.tolerance != null) ||
      (d && d.note && d.note.trim())
    ),
    fullComplete: am.complete && pm.complete,
  };
}

// --- NIGHT SUGGESTION (soft: weekly target + spacing) ------------------------
export function countNightsInWindow(
  state: AppState,
  endStr: string,
  days: number,
  type: NightType,
): number {
  let c = 0;
  for (const date of lastNDays(addDays(endStr, -1), days)) {
    // previous window (excludes the day itself)
    const d = getDay(state, date);
    if (d && d.pm && d.pm.type === type) c++;
  }
  return c;
}

export function daysSinceLast(
  state: AppState,
  endStr: string,
  type: NightType,
  maxBack: number,
): number {
  for (let i = 1; i <= maxBack; i++) {
    const d = getDay(state, addDays(endStr, -i));
    if (d && d.pm && d.pm.type === type) return i;
  }
  return Infinity;
}

export function suggestNight(state: AppState, dateStr: string): NightSuggestion {
  const phase = phaseForDate(state, dateStr);
  const s = state.settings;

  const retTarget = Math.max(0, s.retinolB3PerWeek | 0);
  const retCount = countNightsInWindow(state, dateStr, 7, "retinolB3");
  const retSince = daysSinceLast(state, dateStr, "retinolB3", 14);
  const retSpacing = retTarget > 0 ? Math.max(1, Math.floor(7 / retTarget)) : 99;
  const retBehind = retCount < retTarget && retSince >= retSpacing;

  if (phase === 1) {
    if (retBehind) {
      return { type: "retinolB3", reason: { code: "retBehind", ret: retCount, target: retTarget, since: retSince } };
    }
    return {
      type: "recovery",
      reason: retTarget === 0 ? { code: "retPaused" } : { code: "retMet", ret: retCount, target: retTarget },
    };
  }

  // Phase 2: retinol and SANA never on the same night.
  const sanaTarget = Math.max(0, s.sanaPerWeek | 0);
  const sanaCount = countNightsInWindow(state, dateStr, 7, "sana");
  const sanaSince = daysSinceLast(state, dateStr, "sana", 14);
  const sanaSpacing = sanaTarget > 0 ? Math.max(1, Math.floor(7 / sanaTarget)) : 99;
  const sanaBehind = sanaCount < sanaTarget && sanaSince >= sanaSpacing;

  // Relative deficit to prioritize whichever is further behind its target.
  const retDeficit = retTarget > 0 ? (retTarget - retCount) / retTarget : -1;
  const sanaDeficit = sanaTarget > 0 ? (sanaTarget - sanaCount) / sanaTarget : -1;

  if (retBehind && sanaBehind) {
    if (sanaDeficit > retDeficit) {
      return { type: "sana", reason: { code: "sanaPreferred", sana: sanaCount, target: sanaTarget } };
    }
    return { type: "retinolB3", reason: { code: "retPreferred", ret: retCount, target: retTarget } };
  }
  if (retBehind) {
    return { type: "retinolB3", reason: { code: "retBehind", ret: retCount, target: retTarget, since: retSince } };
  }
  if (sanaBehind) {
    return { type: "sana", reason: { code: "sanaBehind", sana: sanaCount, target: sanaTarget, since: sanaSince } };
  }
  return { type: "recovery", reason: { code: "allMet" } };
}

// --- IRRITATION WARNING ------------------------------------------------------
export function recentIrritation(state: AppState, dateStr: string): IrritationCheck {
  const w = IRRITATION_WARNING;
  let count = 0;
  for (const date of lastNDays(dateStr, w.lookbackDays)) {
    const d = getDay(state, date);
    if (d && d.tolerance != null && d.tolerance >= w.minLevel) count++;
  }
  return { triggered: count >= w.minCount, count };
}

// --- STATS -------------------------------------------------------------------
export function stats(state: AppState, endStr: string, windowDays: number): Stats {
  const dates = lastNDays(endStr, windowDays).filter((dt) => !isFuture(dt));
  let amComplete = 0,
    pmComplete = 0,
    retinol = 0,
    sana = 0,
    recovery = 0,
    irritation = 0;
  let tolSum = 0,
    tolN = 0,
    registered = 0;
  const tolSeries: Stats["tolSeries"] = [];
  for (const date of dates) {
    const st = dayStatus(state, date);
    if (st.am.complete) amComplete++;
    if (st.pm.complete) pmComplete++;
    if (st.pm.type === "retinolB3") retinol++;
    if (st.pm.type === "sana") sana++;
    if (st.pm.type === "recovery") recovery++;
    if (st.tolerance != null) {
      tolSum += st.tolerance;
      tolN++;
      if (st.tolerance >= 2) irritation++;
    }
    if (st.registered) registered++;
    tolSeries.push({ date, value: st.tolerance });
  }
  return {
    windowDays,
    totalDays: dates.length,
    registered,
    amComplete,
    pmComplete,
    retinol,
    sana,
    recovery,
    irritation,
    tolAvg: tolN ? tolSum / tolN : null,
    tolN,
    tolSeries,
    amPct: pct(amComplete, dates.length),
    pmPct: pct(pmComplete, dates.length),
  };
}

/** Max SANA target given current tolerance confirmation. */
export function maxSanaPerWeek(state: AppState): number {
  return state.settings.sanaToleratedConfirmed
    ? DEFAULT_TARGETS.sanaPerWeekMax
    : DEFAULT_TARGETS.sanaPerWeekStart;
}
