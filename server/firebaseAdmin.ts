import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
  } else {
    console.warn('⚠️ FIREBASE ADMIN CREDENTIALS MISSING! Firestore will not be available.');
  }
}

export const getDb = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Check environment variables.');
  }
  return admin.firestore();
};

export default admin;
