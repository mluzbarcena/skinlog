/* =============================================================================
   engine.ts — cross-device sync orchestration.

   Wires the local store (domain/storage) to a per-user Firestore document
   `users/{uid}` and keeps them reconciled with per-day last-writer-wins merges:
     - remote changes  -> mergeStates(local, remote) -> applyRemoteState()
     - local changes   -> debounced push of the merged state to Firestore
   Anti-loop: our own writes echo back with hasPendingWrites (ignored), and a
   serialized fingerprint (lastSyncedJson) skips pushing state we just received.

   Exposes a tiny React-free store (getSyncState/subscribeSync) so useSync() can
   bind via useSyncExternalStore, plus enableSync()/disableSync() user gestures.
   Firebase is only touched when configured AND the user opted in (SYNC_FLAG),
   so users who never sign in never load the SDK.
   ============================================================================= */

import type { Unsubscribe, User } from "firebase/auth";
import { SCHEMA_VERSION } from "../domain/config";
import { applyRemoteState, getSnapshot, migrate, subscribe } from "../domain/storage";
import { mergeStates } from "../domain/sync/merge";
import type { AppState } from "../domain/types";
import { onUser, signInWithGoogle, signOutUser } from "./auth";
import { getFirebase, isConfigured } from "./firebase";

export type SyncStatus = "off" | "signedOut" | "syncing" | "synced" | "error";

export interface SyncState {
  status: SyncStatus;
  user: { uid: string; email: string | null } | null;
  lastSyncedAt: number | null;
  error: string | null;
}

// localStorage marker: set once the user opts into sync so we can auto-resume on
// boot WITHOUT loading Firebase for users who never signed in.
const SYNC_FLAG = "skinlog:syncEnabled";
const PUSH_DEBOUNCE_MS = 1500;

// --- tiny external store for sync status ------------------------------------
let syncState: SyncState = { status: isConfigured() ? "signedOut" : "off", user: null, lastSyncedAt: null, error: null };
const listeners = new Set<() => void>();

function setSync(patch: Partial<SyncState>): void {
  syncState = { ...syncState, ...patch };
  listeners.forEach((fn) => fn());
}

export function subscribeSync(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getSyncState(): SyncState {
  return syncState;
}

// --- runtime wiring ----------------------------------------------------------
let authStarted = false;
let unsubStore: (() => void) | null = null;
let unsubSnapshot: Unsubscribe | null = null;
let docRef: import("firebase/firestore").DocumentReference | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
// Fingerprint of the last state we know is reconciled with the server. Guards
// against re-pushing state that a remote merge just applied locally.
let lastSyncedJson = "";

/** JSON.stringify with recursively sorted object keys, so equality is independent
 *  of key insertion order (Firestore may return maps in a different order than we
 *  wrote them — without this two devices could ping-pong redundant writes). */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .sort()
    .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
    .join(",");
  return "{" + body + "}";
}

/** Order-independent fingerprint of the syncable slice of AppState. */
function fingerprint(s: AppState): string {
  return stableStringify({ settings: s.settings, days: s.days, meta: s.meta });
}

/** Strips undefined (Firestore rejects it) and yields a plain writable object. */
function toDoc(s: AppState): Record<string, unknown> {
  return JSON.parse(JSON.stringify({ version: SCHEMA_VERSION, settings: s.settings, days: s.days, meta: s.meta }));
}

async function pushNow(): Promise<void> {
  if (!docRef) return;
  const state = getSnapshot();
  try {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(docRef, toDoc(state));
    lastSyncedJson = fingerprint(state);
    setSync({ status: "synced", lastSyncedAt: Date.now(), error: null });
  } catch (e) {
    console.error("Sync push failed:", e);
    setSync({ status: "error", error: e instanceof Error ? e.message : String(e) });
  }
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  setSync({ status: "syncing" });
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow();
  }, PUSH_DEBOUNCE_MS);
}

function onLocalChange(): void {
  // Skip when the current state already matches what the server has (this also
  // absorbs the store notification fired by applyRemoteState).
  if (fingerprint(getSnapshot()) === lastSyncedJson) return;
  schedulePush();
}

async function handleSignIn(user: User): Promise<void> {
  setSync({ status: "syncing", user: { uid: user.uid, email: user.email }, error: null });
  const { db } = await getFirebase();
  const { doc, onSnapshot } = await import("firebase/firestore");
  docRef = doc(db, "users", user.uid);
  lastSyncedJson = "";

  unsubSnapshot = onSnapshot(
    docRef,
    (snap) => {
      if (snap.metadata.hasPendingWrites) return; // our own write echoing back
      const local = getSnapshot();
      if (!snap.exists()) {
        // Fresh account: seed the cloud with local data.
        schedulePush();
        return;
      }
      const remote = migrate(snap.data());
      const merged = mergeStates(local, remote);
      lastSyncedJson = fingerprint(merged);
      applyRemoteState(merged);
      if (fingerprint(merged) !== fingerprint(remote)) {
        schedulePush(); // we hold data the server doesn't have yet
      } else {
        setSync({ status: "synced", lastSyncedAt: Date.now(), error: null });
      }
    },
    (err) => {
      console.error("Sync listener failed:", err);
      setSync({ status: "error", error: err.message });
    },
  );

  if (!unsubStore) unsubStore = subscribe(onLocalChange);
}

function handleSignOut(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  unsubSnapshot?.();
  unsubSnapshot = null;
  unsubStore?.();
  unsubStore = null;
  docRef = null;
  lastSyncedJson = "";
  setSync({ status: "signedOut", user: null, lastSyncedAt: null, error: null });
}

/** Attaches the Firebase auth listener once (loads the SDK). */
async function ensureAuthListener(): Promise<void> {
  if (authStarted) return;
  authStarted = true;
  await onUser((user) => {
    if (user) void handleSignIn(user);
    else handleSignOut();
  });
}

/**
 * Called at app boot. Only loads Firebase if configured AND the user previously
 * opted into sync, so signed-out users pay nothing.
 */
export async function initSync(): Promise<void> {
  if (!isConfigured() || localStorage.getItem(SYNC_FLAG) !== "1") return;
  await ensureAuthListener();
}

/** User gesture: opt in and start the Google sign-in flow. */
export async function enableSync(): Promise<void> {
  if (!isConfigured()) return;
  localStorage.setItem(SYNC_FLAG, "1");
  try {
    await ensureAuthListener();
    await signInWithGoogle();
  } catch (e) {
    console.error("Sign-in failed:", e);
    setSync({ status: "error", error: e instanceof Error ? e.message : String(e) });
  }
}

/** User gesture: sign out and stop syncing. Local data is untouched. */
export async function disableSync(): Promise<void> {
  localStorage.removeItem(SYNC_FLAG);
  try {
    await signOutUser();
  } catch (e) {
    console.error("Sign-out failed:", e);
  }
  handleSignOut();
}
