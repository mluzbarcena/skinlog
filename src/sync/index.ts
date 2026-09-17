/* =============================================================================
   index.ts — public surface of the sync module. UI imports from here only.
   ============================================================================= */

export {
  disableSync,
  enableSync,
  getSyncState,
  initSync,
  subscribeSync,
  type SyncState,
  type SyncStatus,
} from "./engine";
export { isConfigured as isSyncConfigured } from "./firebase";
