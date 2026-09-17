/* =============================================================================
   merge.test.ts — reconciliation logic for cross-device sync (mergeStates).
   Pure functions, no store/Firebase; builds minimal AppStates directly.
   ============================================================================= */

import { describe, expect, test } from "vitest";
import { mergeStates } from "../domain/sync/merge";
import { SCHEMA_VERSION, defaultSettings, emptyMeta } from "../domain/config";
import type { AppState, DayRecord, SyncMeta } from "../domain/types";

function day(note: string): DayRecord {
  return { am: { done: {}, skipped: false }, pm: { type: null, done: {} }, tolerance: null, note };
}

function state(
  days: Record<string, DayRecord>,
  meta: Partial<SyncMeta> = {},
  settingsUpdatedAt = 0,
): AppState {
  return {
    version: SCHEMA_VERSION,
    settings: defaultSettings(),
    days,
    meta: { ...emptyMeta(), ...meta, settingsUpdatedAt: meta.settingsUpdatedAt ?? settingsUpdatedAt },
  };
}

describe("mergeStates — per-day last-writer-wins", () => {
  test("a day edited on one side and untouched on the other is kept", () => {
    const a = state({ "2026-01-01": day("from A") }, { dayUpdatedAt: { "2026-01-01": 100 } });
    const b = state({});
    const m = mergeStates(a, b);
    expect(m.days["2026-01-01"].note).toBe("from A");
    expect(m.meta.dayUpdatedAt["2026-01-01"]).toBe(100);
  });

  test("conflicting edits: the newer updatedAt wins", () => {
    const a = state({ "2026-01-01": day("older") }, { dayUpdatedAt: { "2026-01-01": 100 } });
    const b = state({ "2026-01-01": day("newer") }, { dayUpdatedAt: { "2026-01-01": 200 } });
    expect(mergeStates(a, b).days["2026-01-01"].note).toBe("newer");
    expect(mergeStates(b, a).days["2026-01-01"].note).toBe("newer"); // commutative
  });

  test("both devices keep their own distinct offline edits", () => {
    const a = state({ "2026-01-01": day("A day") }, { dayUpdatedAt: { "2026-01-01": 100 } });
    const b = state({ "2026-01-02": day("B day") }, { dayUpdatedAt: { "2026-01-02": 100 } });
    const m = mergeStates(a, b);
    expect(m.days["2026-01-01"].note).toBe("A day");
    expect(m.days["2026-01-02"].note).toBe("B day");
  });
});

describe("mergeStates — tombstones", () => {
  test("a deletion newer than the other side's copy removes the day", () => {
    const a = state({ "2026-01-01": day("stale") }, { dayUpdatedAt: { "2026-01-01": 100 } });
    const b = state({}, { deletedDays: { "2026-01-01": 200 } });
    const m = mergeStates(a, b);
    expect(m.days["2026-01-01"]).toBeUndefined();
    expect(m.meta.deletedDays["2026-01-01"]).toBe(200);
  });

  test("an edit newer than a deletion resurrects the day", () => {
    const a = state({ "2026-01-01": day("re-added") }, { dayUpdatedAt: { "2026-01-01": 300 } });
    const b = state({}, { deletedDays: { "2026-01-01": 200 } });
    const m = mergeStates(a, b);
    expect(m.days["2026-01-01"].note).toBe("re-added");
    expect(m.meta.deletedDays["2026-01-01"]).toBeUndefined();
  });

  test("equal edit and deletion clocks keep the day (conservative)", () => {
    const a = state({ "2026-01-01": day("kept") }, { dayUpdatedAt: { "2026-01-01": 200 } });
    const b = state({}, { deletedDays: { "2026-01-01": 200 } });
    expect(mergeStates(a, b).days["2026-01-01"].note).toBe("kept");
  });
});

describe("mergeStates — settings & invariants", () => {
  test("settings from the side with the newer settingsUpdatedAt wins", () => {
    const a = state({}, {}, 100);
    a.settings = { ...a.settings, retinolB3PerWeek: 1 };
    const b = state({}, {}, 200);
    b.settings = { ...b.settings, retinolB3PerWeek: 5 };
    expect(mergeStates(a, b).settings.retinolB3PerWeek).toBe(5);
    expect(mergeStates(a, b).meta.settingsUpdatedAt).toBe(200);
  });

  test("legacy days with no clock survive the merge", () => {
    const a = state({ "2025-12-31": day("legacy") }); // no dayUpdatedAt entry (ts 0)
    const b = state({});
    expect(mergeStates(a, b).days["2025-12-31"].note).toBe("legacy");
  });

  test("merging a state with itself is idempotent", () => {
    const x = state(
      { "2026-01-01": day("one"), "2026-01-02": day("two") },
      { dayUpdatedAt: { "2026-01-01": 100, "2026-01-02": 150 }, deletedDays: { "2026-01-03": 120 } },
      90,
    );
    expect(mergeStates(x, x)).toEqual(x);
  });
});
