// Firebase client — browser only (NOT server-only)
// The config values here are NEXT_PUBLIC_ and safe to expose to the browser.
// They identify the Firebase project; they are NOT secret API keys.
// Firestore security rules enforce actual access control.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
};

// Singleton — safe to call multiple times (Next.js hot reload)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}

/** Sign in anonymously (no account required — Prompt Wars demo friendly).
 *  Returns the user once signed in. Idempotent. */
export async function ensureAnonymousAuth(): Promise<User> {
  const a = getFirebaseAuth();
  if (a.currentUser) return a.currentUser;
  const cred = await signInAnonymously(a);
  return cred.user;
}

export { onAuthStateChanged };
export type { User };
