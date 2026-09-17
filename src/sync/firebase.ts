/* =============================================================================
   firebase.ts — lazy, code-split Firebase bootstrap.

   The Firebase SDK is loaded via dynamic import() ONLY when sync is actually
   used, so offline/signed-out users never download it and the main bundle stays
   lean (the app keeps its "zero network calls" default). Config comes from
   build-time VITE_FIREBASE_* env vars; when absent, isConfigured() is false and
   the whole sync feature is hidden (see SettingsView + engine).
   ============================================================================= */

import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

/** True only when the minimum Firebase web config was provided at build time. */
export function isConfigured(): boolean {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.authDomain);
}

let handles: { auth: Auth; db: Firestore } | null = null;

/** Initializes Firebase on first call (dynamic import) and returns shared handles. */
export async function getFirebase(): Promise<{ auth: Auth; db: Firestore }> {
  if (!isConfigured()) throw new Error("Firebase is not configured");
  if (!handles) {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
      import("firebase/firestore"),
    ]);
    const app = initializeApp(cfg);
    handles = { auth: getAuth(app), db: getFirestore(app) };
  }
  return handles;
}
