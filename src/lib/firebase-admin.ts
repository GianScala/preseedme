// src/app/.../firebase-admin.ts
import * as admin from "firebase-admin";

export const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    const json = process.env.FIREBASE_ADMIN_KEY;
    if (!json) {
      throw new Error(
        "FIREBASE_ADMIN_KEY env var is not set. Make sure it's in your .env.local (for dev) and in Vercel env vars (for prod)."
      );
    }
    
    const serviceAccount = JSON.parse(json);
    
    // FIX: Convert escaped newlines to actual newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key
        .replace(/\\n/g, '\n')
        .trim();
    }
    
    console.log("🔑 Initializing Firebase Admin from FIREBASE_ADMIN_KEY env var...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
  return admin;
};