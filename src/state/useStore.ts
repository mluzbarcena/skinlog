/* =============================================================================
   useStore.ts — binds the framework-agnostic store (domain/storage.ts) to React
   via useSyncExternalStore. Components read the current AppState and call the
   exported actions; any mutation re-renders subscribers.
   ============================================================================= */

import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "../domain/storage";
import type { AppState, Settings } from "../domain/types";

export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience selector for settings (still re-renders on any state change). */
export function useSettings(): Settings {
  return useStore().settings;
}

// Re-export actions so components import everything store-related from one place.
export {
  saveDay,
  updateSettings,
  clearAll,
  importJSON,
  exportJSON,
  exportCSV,
  getDay,
  emptyDay,
  isDayEmpty,
} from "../domain/storage";
