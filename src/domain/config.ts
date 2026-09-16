/* =============================================================================
   config.ts — ALL EDITABLE RULES OF THE APP LIVE HERE.
   -----------------------------------------------------------------------------
   To change products, routine steps per phase, default weekly targets or the
   irritation-warning threshold, this is the only file you need to touch.
   User-facing wording (night-type labels/hints, tolerance labels, warning text)
   lives in the i18n dictionaries (src/i18n) so it can be translated.
   ============================================================================= */

import type {
  Lang,
  NightType,
  NightTypeMeta,
  ProductId,
  RoutineStep,
  Settings,
  ToleranceMeta,
} from "./types";

export const STORAGE_KEY = "skincareTracker:v1";
export const SCHEMA_VERSION = 1;

// -----------------------------------------------------------------------------
// 1) PRODUCTS  (stable id -> default visible name)
// The id is never shown and must not change: it is what the logic keys off.
// The visible name is editable from Settings (stored in settings.productNames).
// -----------------------------------------------------------------------------
export const PRODUCTS: Record<ProductId, string> = {
  cleanser: "CeraVe Gel Limpiador Espumoso",
  hyaluEyes: "La Roche-Posay Hyalu B5 Eyes",
  sanaWrinkle: "SANA Nameraka Honpo Wrinkle Care Eye Cream",
  sanaBright: "SANA Nameraka Honpo Brightening Eye Cream",
  retinolB3: "La Roche-Posay Retinol B3 Serum",
  moisturizer: "AMPASTUDIO Crema Restauradora",
  spf: "La Roche-Posay Anthelios UV Air SPF50+ Serum",
};

// -----------------------------------------------------------------------------
// 2) ROUTINE TEMPLATES PER PHASE
// Each step is { id } or { id, optional:true }.
// "optional:true" => not marking it does NOT count as an incomplete routine.
// 'sanaBright' additionally only appears in AM if enabled in Settings.
// -----------------------------------------------------------------------------
export const ROUTINES: Record<
  1 | 2,
  { am: RoutineStep[]; pm: Partial<Record<NightType, RoutineStep[]>> }
> = {
  1: {
    am: [{ id: "cleanser" }, { id: "hyaluEyes" }, { id: "moisturizer" }, { id: "spf" }],
    pm: {
      retinolB3: [{ id: "cleanser" }, { id: "retinolB3" }, { id: "hyaluEyes" }, { id: "moisturizer" }],
      recovery: [{ id: "cleanser" }, { id: "hyaluEyes" }, { id: "moisturizer" }],
    },
  },
  2: {
    am: [{ id: "cleanser" }, { id: "sanaBright", optional: true }, { id: "moisturizer" }, { id: "spf" }],
    pm: {
      retinolB3: [{ id: "cleanser" }, { id: "retinolB3" }, { id: "moisturizer" }],
      sana: [{ id: "cleanser" }, { id: "sanaWrinkle" }, { id: "moisturizer" }],
      recovery: [{ id: "cleanser" }, { id: "moisturizer" }],
    },
  },
};

// Night types available per phase (includes 'none' = did no routine).
export const NIGHT_TYPES_BY_PHASE: Record<1 | 2, NightType[]> = {
  1: ["retinolB3", "recovery", "none"],
  2: ["retinolB3", "sana", "recovery", "none"],
};

// Per night-type metadata (color token + whether it counts as retinol).
// Labels and hints are translated in the i18n dictionaries.
export const NIGHT_TYPES: Record<NightType, NightTypeMeta> = {
  retinolB3: { color: "retinol", counts: true },
  sana: { color: "sana", counts: true },
  recovery: { color: "recovery", counts: false },
  none: { color: "none", counts: false },
};

// -----------------------------------------------------------------------------
// 3) SKIN TOLERANCE SCALE (labels are translated in i18n)
// -----------------------------------------------------------------------------
export const TOLERANCE: ToleranceMeta[] = [
  { level: 0, emoji: "🙂", color: "tol0" },
  { level: 1, emoji: "😐", color: "tol1" },
  { level: 2, emoji: "😣", color: "tol2" },
  { level: 3, emoji: "😖", color: "tol3" },
];

// -----------------------------------------------------------------------------
// 4) IRRITATION WARNING
// If within the last `lookbackDays` days there are at least `minCount` records
// with tolerance >= `minLevel`, the app warns (without blocking) when picking a
// retinol night or raising a target. This is a reminder, not a diagnosis.
// -----------------------------------------------------------------------------
export const IRRITATION_WARNING = {
  lookbackDays: 7,
  minCount: 2,
  minLevel: 2, // 2 = moderate, 3 = severe
};

// -----------------------------------------------------------------------------
// 5) DEFAULT WEEKLY TARGETS
// The app NEVER raises these on its own: it only suggests, and you can always
// override the night type of any day manually.
// -----------------------------------------------------------------------------
export const DEFAULT_TARGETS = {
  retinolB3PerWeek: 3, // target "2-3": stored as a number, editable in Settings
  sanaPerWeekStart: 1, // starts at 1x/week in Phase 2
  sanaPerWeekMax: 2, // only unlocked after confirming "I tolerate SANA well"
};

// -----------------------------------------------------------------------------
// 6) DEFAULT SETTINGS (initial state the first time the app is opened)
// -----------------------------------------------------------------------------
function detectLang(): Lang {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
  }
  return "es";
}

export function defaultSettings(): Settings {
  const today = new Date();
  const routineStartDate =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");
  return {
    routineStartDate,
    hyaluFinishedDate: null, // null => Phase 1; date => Phase 2 from that day
    retinolB3PerWeek: DEFAULT_TARGETS.retinolB3PerWeek,
    sanaPerWeek: DEFAULT_TARGETS.sanaPerWeekStart,
    sanaToleratedConfirmed: false, // enables raising SANA to 2x/week
    brightingEnabled: true, // SANA Brightening optional in AM
    theme: "auto", // "auto" | "light" | "dark"
    language: detectLang(),
    productNames: { ...PRODUCTS },
  };
}
