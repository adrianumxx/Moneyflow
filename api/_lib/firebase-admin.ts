import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'remixed-project-id'
    });
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
  }
}

export const db = admin.firestore();
export { admin };
