import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId
      });
      console.log('Firebase Admin initialized with Service Account.');
    } else {
      admin.initializeApp({
        projectId: projectId || 'remixed-project-id'
      });
      console.log('Firebase Admin initialized with Project ID only (Default Credentials).');
    }
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
  }
}

let dbInstance: admin.firestore.Firestore | null = null;

export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_, prop) {
    if (!dbInstance) {
      try {
        dbInstance = admin.firestore();
      } catch (e) {
        console.error('Firestore access failed - Admin not initialized:', e);
        throw new Error('Database connection unavailable');
      }
    }
    return (dbInstance as any)[prop];
  }
});

export default admin;
