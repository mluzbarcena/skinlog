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
  Product,
  ProductId,
  Routines,
  Settings,
  SyncMeta,
  ToleranceMeta,
} from "./types";

export const STORAGE_KEY = "skincareTracker:v1";
// v2 -> v3: added SyncMeta (`meta`) for cross-device sync. Purely additive:
// v2 payloads migrate by getting a fresh emptyMeta(); no day/settings data moves.
export const SCHEMA_VERSION = 3;

/** Fresh sync metadata for a new or newly-migrated state. */
export function emptyMeta(): SyncMeta {
  return { dayUpdatedAt: {}, deletedDays: {}, settingsUpdatedAt: 0 };
}

/** Optional AM step that is hidden unless `settings.brightingEnabled` is on. */
export const BRIGHTENING_STEP_ID: ProductId = "sanaBright";

// -----------------------------------------------------------------------------
// 1) SEED PRODUCTS  (stable id + default visible name, in catalog order)
// These are only the defaults for a fresh install / migration. The catalog is
// editable from Settings and lives in settings.products from then on.
// -----------------------------------------------------------------------------
export const SEED_PRODUCTS: Product[] = [
  { id: "cleanser", name: "CeraVe Gel Limpiador Espumoso", order: 0 },
  { id: "hyaluEyes", name: "La Roche-Posay Hyalu B5 Eyes", order: 1 },
  { id: "sanaWrinkle", name: "SANA Nameraka Honpo Wrinkle Care Eye Cream", order: 2 },
  { id: "sanaBright", name: "SANA Nameraka Honpo Brightening Eye Cream", order: 3 },
  { id: "retinolB3", name: "La Roche-Posay Retinol B3 Serum", order: 4 },
  { id: "moisturizer", name: "AMPASTUDIO Crema Restauradora", order: 5 },
  { id: "spf", name: "La Roche-Posay Anthelios UV Air SPF50+ Serum", order: 6 },
];

// -----------------------------------------------------------------------------
// 2) SEED ROUTINE TEMPLATES PER PHASE
// Each step is { id } or { id, optional:true }.
// "optional:true" => not marking it does NOT count as an incomplete routine.
// 'sanaBright' (BRIGHTENING_STEP_ID) additionally only appears in AM if enabled.
// Seed only: the actual templates are editable and live in settings.routines.
// -----------------------------------------------------------------------------
export const SEED_ROUTINES: Routines = {
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
    products: SEED_PRODUCTS.map((p) => ({ ...p })),
    routines: structuredClone(SEED_ROUTINES),
  };
}
