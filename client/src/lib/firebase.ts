// ---------------------------------------------------------------------------
// Firebase initialization. Config is loaded from Vite env vars (client/.env,
// which is gitignored) rather than hard-coded.
//
// SECURITY NOTE — these values are intentionally public.
// A Firebase "web app config" (apiKey, appId, etc.) is a set of *project
// identifiers*, not credentials. Firebase is designed to ship them in client
// code. Account safety is enforced server-side by Firebase Authentication, the
// project's authorized-domain allowlist, and (next phase) verifying the signed
// ID token in our Java backend before trusting any request. The real secret —
// the Admin SDK service-account key — lives only on the server and is never in
// this repo. We still load these from .env so they're easy to rotate per
// environment and stay out of version control.
// ---------------------------------------------------------------------------
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** True only when the essential keys are present. */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(config);
  auth = getAuth(app);
}

export { app, auth };
