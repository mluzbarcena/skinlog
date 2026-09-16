/* =============================================================================
   logic.test.ts — port of the original _test.js core-logic suite to Vitest.
   Same fixed base date and assertions; logic now takes the state explicitly and
   the store is driven through its public mutations.
   ============================================================================= */

import { beforeEach, describe, expect, test } from "vitest";
import { addDays } from "../domain/dates";
import {
  amSteps,
  dayStatus,
  nightTypesFor,
  phaseForDate,
  pmSteps,
  recentIrritation,
  stats,
  suggestNight,
} from "../domain/logic";
import {
  clearAll,
  emptyDay,
  exportCSV,
  exportJSON,
  getDay,
  getSnapshot,
  importJSON,
  saveDay,
  updateSettings,
} from "../domain/storage";
import type { DayRecord } from "../domain/types";

// Fixed base date (not real "today") for reproducible relative windows.
const T = "2026-03-15"; // Sunday
const S = () => getSnapshot();

// Merge a partial record into the existing day (mirrors the old ensureDay+assign).
function setDay(date: string, obj: Partial<DayRecord>) {
  const d: DayRecord = { ...emptyDay(), ...getDay(date) };
  Object.assign(d, obj);
  saveDay(date, d);
}

beforeEach(() => clearAll());

describe("phase & completeness", () => {
  test("initial phase = 1, empty day not registered, AM total phase1 = 4", () => {
    expect(phaseForDate(S(), T)).toBe(1);
    expect(dayStatus(S(), T).registered).toBe(false);
    expect(amSteps(S(), T).filter((s) => !s.optional).length).toBe(4);
  });

  test("AM complete", () => {
    setDay(T, { am: { done: { cleanser: true, hyaluEyes: true, moisturizer: true, spf: true }, skipped: false } });
    const st = dayStatus(S(), T);
    expect(st.am.complete).toBe(true);
    expect(st.am.done).toBe(4);
  });

  test("PM retinol complete (phase 1 => 4 steps) and full complete", () => {
    setDay(T, { am: { done: { cleanser: true, hyaluEyes: true, moisturizer: true, spf: true }, skipped: false } });
    setDay(T, { pm: { type: "retinolB3", done: { cleanser: true, retinolB3: true, hyaluEyes: true, moisturizer: true } } });
    const st = dayStatus(S(), T);
    expect(st.pm.total).toBe(4);
    expect(st.pm.complete).toBe(true);
    expect(st.fullComplete).toBe(true);
  });
});

describe("phase transition", () => {
  test("hyaluFinishedDate flips the phase at the cutoff date", () => {
    updateSettings({ hyaluFinishedDate: T });
    expect(phaseForDate(S(), T)).toBe(2);
    expect(phaseForDate(S(), addDays(T, -1))).toBe(1);
    expect(nightTypesFor(S(), T)).toContain("sana");
    expect(nightTypesFor(S(), addDays(T, -1))).not.toContain("sana");
    expect(pmSteps(S(), T, "retinolB3").length).toBe(3);
    expect(pmSteps(S(), T, "sana").length).toBe(3);
  });

  test("AM phase2 includes optional sanaBright only when enabled", () => {
    updateSettings({ hyaluFinishedDate: T });
    expect(amSteps(S(), T).length).toBe(4);
    expect(amSteps(S(), T).some((s) => s.id === "sanaBright" && s.optional)).toBe(true);
    updateSettings({ brightingEnabled: false });
    expect(amSteps(S(), T).length).toBe(3);
  });
});

describe("night suggestion", () => {
  test("no history (phase 1) => retinolB3", () => {
    expect(suggestNight(S(), T).type).toBe("retinolB3");
  });

  test("3 retinol nights this week => recovery", () => {
    [1, 3, 5].forEach((off) => setDay(addDays(T, -off), { pm: { type: "retinolB3", done: {} } }));
    expect(suggestNight(S(), T).type).toBe("recovery");
  });
});

describe("irritation warning", () => {
  test("recent moderate/severe irritation triggers; none does not", () => {
    setDay(addDays(T, -1), { tolerance: 2 });
    setDay(addDays(T, -2), { tolerance: 3 });
    expect(recentIrritation(S(), T).triggered).toBe(true);
    setDay(addDays(T, -1), { tolerance: 0 });
    setDay(addDays(T, -2), { tolerance: 0 });
    expect(recentIrritation(S(), T).triggered).toBe(false);
  });
});

describe("optional steps & stats", () => {
  test("phase2 AM complete without using optional sanaBright", () => {
    updateSettings({ hyaluFinishedDate: T });
    setDay(T, { am: { done: { cleanser: true, moisturizer: true, spf: true }, skipped: false } });
    expect(dayStatus(S(), T).am.complete).toBe(true);
  });

  test("7-day stats", () => {
    for (let i = 0; i < 7; i++) {
      setDay(addDays(T, -i), {
        am: { done: { cleanser: true, hyaluEyes: true, moisturizer: true, spf: true }, skipped: false },
      });
    }
    setDay(T, {
      pm: { type: "retinolB3", done: { cleanser: true, retinolB3: true, hyaluEyes: true, moisturizer: true } },
      tolerance: 1,
    });
    const s7 = stats(S(), T, 7);
    expect(s7.amComplete).toBe(7);
    expect(s7.retinol).toBe(1);
    expect(s7.tolAvg).toBe(1);
  });
});

describe("export / import & empty-day cleanup", () => {
  test("CSV has header + one row and export/import roundtrip preserves data", () => {
    setDay(T, { pm: { type: "sana", done: { sanaWrinkle: true } }, tolerance: 2, note: "test, with comma" });
    updateSettings({ retinolB3PerWeek: 2 });
    const dump = exportJSON();
    const csv = exportCSV();
    expect(csv.split("\r\n").length).toBe(2);
    expect(csv).toContain("test");

    clearAll();
    expect(Object.keys(S().days).length).toBe(0);

    const res = importJSON(dump);
    expect(res.ok).toBe(true);
    expect(res.days).toBe(1);
    expect(getDay(T)?.note).toBe("test, with comma");
    expect(S().settings.retinolB3PerWeek).toBe(2);
    expect(importJSON("{no json").ok).toBe(false);
  });

  test("empty day is not persisted", () => {
    saveDay(T, { am: { done: {}, skipped: false }, pm: { type: null, done: {} }, tolerance: null, note: "" });
    expect(getDay(T)).toBeNull();
  });
});

describe("v1 -> v2 migration", () => {
  // A legacy (schema v1) payload: settings.productNames instead of products[],
  // no routines, and per-day records keyed by the seeded product ids.
  const v1 = {
    version: 1,
    settings: {
      routineStartDate: "2026-01-01",
      hyaluFinishedDate: null,
      retinolB3PerWeek: 3,
      sanaPerWeek: 1,
      sanaToleratedConfirmed: false,
      brightingEnabled: true,
      theme: "auto",
      language: "es",
      productNames: {
        cleanser: "Mi limpiador",
        retinolB3: "Mi retinol",
        legacyExtra: "Producto viejo",
      },
    },
    days: {
      [T]: {
        am: { done: { cleanser: true, hyaluEyes: true, moisturizer: true, spf: true }, skipped: false },
        pm: { type: "retinolB3", done: { cleanser: true, retinolB3: true, hyaluEyes: true, moisturizer: true } },
        tolerance: 1,
        note: "hola",
      },
    },
  };

  test("importing a v1 dump migrates products/routines and preserves history", () => {
    const res = importJSON(JSON.stringify(v1));
    expect(res.ok).toBe(true);

    const st = S();
    expect(st.version).toBe(2);
    expect(Array.isArray(st.settings.products)).toBe(true);
    // Legacy productNames key is gone.
    expect((st.settings as unknown as Record<string, unknown>).productNames).toBeUndefined();

    // Seeded ids preserved; custom names honored; unknown legacy id kept as extra.
    const byId = Object.fromEntries(st.settings.products.map((p) => [p.id, p.name]));
    expect(byId.cleanser).toBe("Mi limpiador");
    expect(byId.retinolB3).toBe("Mi retinol");
    expect(byId.spf).toBe("La Roche-Posay Anthelios UV Air SPF50+ Serum");
    expect(byId.legacyExtra).toBe("Producto viejo");
    expect(st.settings.products.length).toBe(8); // 7 seeded + 1 extra

    // Routines seeded, so the history still resolves to complete.
    expect(st.settings.routines[1].am.length).toBe(4);
    expect(getDay(T)?.note).toBe("hola");
    expect(dayStatus(st, T).am.complete).toBe(true);
    expect(dayStatus(st, T).pm.complete).toBe(true);
  });

  test("migration is idempotent (re-importing the migrated dump is stable)", () => {
    importJSON(JSON.stringify(v1));
    const once = exportJSON();
    importJSON(once);
    expect(exportJSON()).toBe(once);
    expect((S().settings as unknown as Record<string, unknown>).productNames).toBeUndefined();
  });
});

describe("editable steps guards", () => {
  test("steps referencing a deleted product are filtered out", () => {
    updateSettings({
      products: [{ id: "cleanser", name: "C", order: 0 }],
      routines: {
        1: { am: [{ id: "cleanser" }, { id: "ghost" }], pm: {} },
        2: { am: [], pm: {} },
      },
    });
    const am = amSteps(S(), T);
    expect(am.length).toBe(1);
    expect(am.some((s) => s.id === "ghost")).toBe(false);
  });

  test("a newly added product shows up once assigned to a routine", () => {
    updateSettings({
      products: [
        { id: "cleanser", name: "C", order: 0 },
        { id: "vitc", name: "Vitamin C", order: 1 },
      ],
      routines: {
        1: { am: [{ id: "cleanser" }, { id: "vitc" }], pm: {} },
        2: { am: [], pm: {} },
      },
    });
    expect(amSteps(S(), T).some((s) => s.id === "vitc")).toBe(true);
  });
});
