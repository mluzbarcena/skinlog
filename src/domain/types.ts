/* =============================================================================
   types.ts — shared domain types for the whole app.
   Data model is unchanged from the vanilla version so existing localStorage
   payloads keep working.
   ============================================================================= */

export type Lang = "es" | "en";

export type Phase = 1 | 2;

/**
 * Stable product id. Never translated; the logic and the per-day records key off
 * it. Seeded products keep their legacy ids ("cleanser", ...); products created
 * by the user get a generated id. It used to be a fixed union of literals; it is
 * now a free string so products can be added/removed at runtime.
 */
export type ProductId = string;

/** Night types selectable in the PM slot ("none" = did no routine). */
export type NightType = "retinolB3" | "sana" | "recovery" | "none";

/** Night types that own a routine (everything except "none"). */
export type EditableNight = Exclude<NightType, "none">;

/** Tolerance level: 0 (no irritation) .. 3 (severe). null = not recorded. */
export type ToleranceLevel = 0 | 1 | 2 | 3;

/** A user-editable product in the catalog. */
export interface Product {
  id: ProductId;
  name: string;
  /** Position in the catalog; lower comes first. */
  order: number;
}

export interface RoutineStep {
  id: ProductId;
  optional?: boolean;
}

/** Editable routine templates per phase (AM list + one PM list per night type). */
export interface Routines {
  1: { am: RoutineStep[]; pm: Partial<Record<EditableNight, RoutineStep[]>> };
  2: { am: RoutineStep[]; pm: Partial<Record<EditableNight, RoutineStep[]>> };
}

export interface NightTypeMeta {
  /** Semantic color token name (retinol | sana | recovery | none). */
  color: string;
  /** Whether this night counts as a retinol application toward weekly targets. */
  counts: boolean;
}

export interface ToleranceMeta {
  level: ToleranceLevel;
  emoji: string;
  color: string;
}

export interface Settings {
  routineStartDate: string;
  /** null => Phase 1; date => Phase 2 from that day on. */
  hyaluFinishedDate: string | null;
  retinolB3PerWeek: number;
  sanaPerWeek: number;
  /** Unlocks raising sanaPerWeek to the max. */
  sanaToleratedConfirmed: boolean;
  /** SANA Brightening optional step shown in the AM routine. */
  brightingEnabled: boolean;
  theme: "auto" | "light" | "dark";
  language: Lang;
  /** Editable product catalog (replaces the old productNames map). */
  products: Product[];
  /** Editable routine steps per phase (replaces the hardcoded config.ROUTINES). */
  routines: Routines;
}

export interface AmRecord {
  done: Partial<Record<ProductId, boolean>>;
  skipped: boolean;
}

export interface PmRecord {
  type: NightType | null;
  done: Partial<Record<ProductId, boolean>>;
}

export interface DayRecord {
  am: AmRecord;
  pm: PmRecord;
  tolerance: ToleranceLevel | null;
  note: string;
}

export interface AppState {
  version: number;
  settings: Settings;
  days: Record<string, DayRecord>;
}

export interface AmStatus {
  total: number;
  done: number;
  optionalDone: number;
  complete: boolean;
  skipped: boolean;
  registered: boolean;
}

export interface PmStatus {
  type: NightType | null;
  total: number;
  done: number;
  isRealRoutine: boolean;
  noRoutine: boolean;
  complete: boolean;
  registered: boolean;
}

export interface DayStatus {
  date: string;
  phase: Phase;
  am: AmStatus;
  pm: PmStatus;
  tolerance: ToleranceLevel | null;
  note: string;
  registered: boolean;
  fullComplete: boolean;
}

/**
 * Structured, language-agnostic reason for a night suggestion. The UI turns
 * the `code` + numeric fields into a localized sentence (see i18n dictionaries).
 */
export type SuggestionReason =
  | { code: "retBehind"; ret: number; target: number; since: number }
  | { code: "retPaused" }
  | { code: "retMet"; ret: number; target: number }
  | { code: "retPreferred"; ret: number; target: number }
  | { code: "sanaPreferred"; sana: number; target: number }
  | { code: "sanaBehind"; sana: number; target: number; since: number }
  | { code: "allMet" };

export interface NightSuggestion {
  type: NightType;
  reason: SuggestionReason;
}

export interface IrritationCheck {
  triggered: boolean;
  count: number;
}

export interface Stats {
  windowDays: number;
  totalDays: number;
  registered: number;
  amComplete: number;
  pmComplete: number;
  retinol: number;
  sana: number;
  recovery: number;
  irritation: number;
  tolAvg: number | null;
  tolN: number;
  tolSeries: { date: string; value: ToleranceLevel | null }[];
  amPct: number;
  pmPct: number;
}
