/* =============================================================================
   storage.ts — in-memory state + localStorage persistence, exposed as a
   framework-agnostic external store (subscribe / getSnapshot) so React can bind
   to it via useSyncExternalStore.

   Persisted shape (single key "skincareTracker:v1"):
     {
       version: 2,
       settings: { ...see config.defaultSettings(); includes products[] + routines },
       days: {
         "YYYY-MM-DD": {
           am:  { done: { productId: true, ... }, skipped: false },
           pm:  { type: "retinolB3"|"sana"|"recovery"|"none"|null, done: {...} },
           tolerance: 0|1|2|3|null,
           note: ""
         }
       }
     }
   ============================================================================= */

import { SCHEMA_VERSION, SEED_PRODUCTS, SEED_ROUTINES, STORAGE_KEY, defaultSettings } from "./config";
import { dayStatus } from "./logic";
import type { AppState, DayRecord, Product, Settings } from "./types";

function emptyState(): AppState {
  return { version: SCHEMA_VERSION, settings: defaultSettings(), days: {} };
}

// Fills in keys that may be missing after a schema update. Idempotent: running
// it twice yields the same result (it never re-seeds an already-migrated state).
function migrate(s: unknown): AppState {
  if (!s || typeof s !== "object") return emptyState();
  const obj = s as Partial<AppState>;
  if (!obj.settings) {
    obj.settings = defaultSettings();
  } else {
    const settings = obj.settings as Settings;
    const settingsRec = settings as unknown as Record<string, unknown>;

    // --- v1 -> v2: build products[] and routines from the legacy shape. ---
    // Per-day records key off product ids, so seeded ids are preserved and the
    // history keeps resolving. Do this BEFORE the generic default-fill below so
    // legacy productNames are honored instead of being overwritten by seeds.
    if (!Array.isArray(settings.products)) {
      const legacy = (settingsRec.productNames as Record<string, string>) || {};
      const seeded: Product[] = SEED_PRODUCTS.map((p) => ({ ...p, name: legacy[p.id] ?? p.name }));
      const seededIds = new Set(SEED_PRODUCTS.map((p) => p.id));
      const extras: Product[] = Object.keys(legacy)
        .filter((id) => !seededIds.has(id))
        .map((id, i) => ({ id, name: legacy[id], order: seeded.length + i }));
      settings.products = [...seeded, ...extras];
    }
    if (!settings.routines) settings.routines = structuredClone(SEED_ROUTINES);
    delete settingsRec.productNames;

    // --- fill any remaining scalar keys missing after a schema update. ---
    const defRec = defaultSettings() as unknown as Record<string, unknown>;
    for (const k in defRec) {
      if (!(k in settingsRec)) settingsRec[k] = defRec[k];
    }
  }
  if (!obj.days || typeof obj.days !== "object") obj.days = {};
  obj.version = SCHEMA_VERSION;
  return obj as AppState;
}

function readInitial(): AppState {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? migrate(JSON.parse(raw)) : emptyState();
  } catch (e) {
    console.warn("Could not read localStorage, starting empty:", e);
    return emptyState();
  }
}

let state: AppState = readInitial();
const listeners = new Set<() => void>();

function persist(next: AppState): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch (e) {
    console.error("Could not save to localStorage:", e);
  }
}

function setState(next: AppState): void {
  state = next;
  persist(next);
  listeners.forEach((fn) => fn());
}

// --- external store API ------------------------------------------------------
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getSnapshot(): AppState {
  return state;
}

export function getDay(dateStr: string): DayRecord | null {
  return state.days[dateStr] || null;
}

// --- mutations ---------------------------------------------------------------
export function emptyDay(): DayRecord {
  return { am: { done: {}, skipped: false }, pm: { type: null, done: {} }, tolerance: null, note: "" };
}

export function isDayEmpty(day: DayRecord | null): boolean {
  if (!day) return true;
  const amDone = day.am && day.am.done ? Object.values(day.am.done).some(Boolean) : false;
  const amSkip = day.am && day.am.skipped;
  const pmType = day.pm && day.pm.type;
  const pmDone = day.pm && day.pm.done ? Object.values(day.pm.done).some(Boolean) : false;
  const tol = day.tolerance != null;
  const note = !!(day.note && day.note.trim().length > 0);
  return !(amDone || amSkip || pmType || pmDone || tol || note);
}

/** Saves a full day (object already built by the UI); drops it if it ended empty. */
export function saveDay(dateStr: string, day: DayRecord): void {
  const days = { ...state.days };
  if (isDayEmpty(day)) delete days[dateStr];
  else days[dateStr] = day;
  setState({ ...state, days });
}

export function updateSettings(patch: Partial<Settings>): void {
  setState({ ...state, settings: { ...state.settings, ...patch } });
}

export function clearAll(): void {
  setState(emptyState());
}

// --- export / import ---------------------------------------------------------
export function exportJSON(): string {
  return JSON.stringify(state, null, 2);
}

function csvCell(v: unknown): string {
  const s = String(v == null ? "" : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function exportCSV(): string {
  const rows: (string | number)[][] = [];
  const header = [
    "date",
    "phase",
    "am_complete",
    "am_steps_done",
    "am_steps_total",
    "am_skipped",
    "pm_type",
    "pm_complete",
    "pm_steps_done",
    "pm_steps_total",
    "tolerance",
    "note",
  ];
  rows.push(header);
  const dates = Object.keys(state.days).sort();
  for (const date of dates) {
    const st = dayStatus(state, date);
    const d = state.days[date];
    rows.push([
      date,
      st.phase,
      st.am.complete ? "yes" : "no",
      st.am.done,
      st.am.total,
      st.am.skipped ? "yes" : "no",
      d.pm.type || "",
      st.pm.complete ? "yes" : "no",
      st.pm.done,
      st.pm.total,
      d.tolerance == null ? "" : d.tolerance,
      (d.note || "").replace(/\r?\n/g, " "),
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

export interface ImportResult {
  ok: boolean;
  days?: number;
  error?: string;
}

/** Imports a previously exported JSON. Replaces the whole state. Validates shape. */
export function importJSON(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "invalidJson" };
  }
  if (!parsed || typeof parsed !== "object" || typeof (parsed as AppState).days !== "object") {
    return { ok: false, error: "invalidShape" };
  }
  setState(migrate(parsed));
  return { ok: true, days: Object.keys(state.days).length };
}
