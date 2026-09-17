/* =============================================================================
   useSync.ts — React binding for the sync engine's status store.
   Components read { status, user, lastSyncedAt } and call enable/disable.
   ============================================================================= */

import { useSyncExternalStore } from "react";
import {
  disableSync,
  enableSync,
  getSyncState,
  isSyncConfigured,
  subscribeSync,
  type SyncState,
} from "./index";

export function useSync(): SyncState & { enable: () => void; disable: () => void; configured: boolean } {
  const state = useSyncExternalStore(subscribeSync, getSyncState, getSyncState);
  return {
    ...state,
    configured: isSyncConfigured(),
    enable: () => void enableSync(),
    disable: () => void disableSync(),
  };
}
