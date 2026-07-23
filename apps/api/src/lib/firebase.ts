import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function buildFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
    });
  }

  // Fallback: Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS env var pointing to a file).
  return initializeApp();
}

const firebaseApp = buildFirebaseApp();

export const firebaseAuth = getAuth(firebaseApp);
