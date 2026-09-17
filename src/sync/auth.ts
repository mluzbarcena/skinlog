/* =============================================================================
   auth.ts — Google Sign-In wrappers over Firebase Auth (lazy-loaded).
   Google is the only provider: cloud data is keyed by the user's uid, so a login
   is required to identify whose data to read/write on a fresh device.
   ============================================================================= */

import type { User } from "firebase/auth";
import { getFirebase } from "./firebase";

export async function signInWithGoogle(): Promise<void> {
  const { auth } = await getFirebase();
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOutUser(): Promise<void> {
  const { auth } = await getFirebase();
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
}

/** Subscribes to auth changes; resolves to an unsubscribe fn. */
export async function onUser(cb: (user: User | null) => void): Promise<() => void> {
  const { auth } = await getFirebase();
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(auth, cb);
}
