import { initializeApp, getApps, App } from "firebase-admin/app";
import {
  initializeFirestore,
  Settings,
  Firestore,
  getFirestore,
} from "firebase-admin/firestore";

export let db: Firestore;

/**
 * Initializes Admin SDK
 */
export async function initialize() {
  // 1. Get or initialize the core Firebase App
  if (getApps().length > 0) {
    const app = getApps()[0];
    db = getFirestore(app);
    return;
  }
  const app: App = initializeApp();

  // 2. Define Firestore settings for "lightweight" REST mode
  const firestoreSettings: Settings = {
    // Force REST instead of gRPC for better cold-start performance
    preferRest: true,
  };

  // 3. Initialize Firestore with specific settings
  db = initializeFirestore(app, firestoreSettings);
}
