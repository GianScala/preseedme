import * as admin from "firebase-admin";

// 1. Import the key directly using your alias
// This automatically finds: src/app/firebase-admin-key.json
import serviceAccount from "../../firebase-admin-key.json";

export const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    console.log("🔑 Loading Firebase Admin from @/app/firebase-admin-key.json...");

    // 2. Initialize using the imported JSON object
    // We cast to 'any' to avoid strict TypeScript interface mismatches with the JSON
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  }
  return admin;
};