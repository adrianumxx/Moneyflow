import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';

// Use environment variables if available (Vite/Vercel/etc), otherwise fallback to JSON
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId
};

const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('remixed-') || firebaseConfig.apiKey.includes('API_KEY');

if (isPlaceholder) {
  console.warn('Firebase is using placeholder configuration. Please ensure you have completed the Firebase setup in the AI Studio environment.');
}

const app = initializeApp(firebaseConfig as any);
export const auth = getAuth(app);

// Enable local persistence
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signInRedirect = () => signInWithRedirect(auth, googleProvider);
export { getRedirectResult };

export const signUpWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const logInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const logOut = () => signOut(auth);

// CRITICAL: Validate connection to Firestore
async function testConnection() {
  if (isPlaceholder) return;
  try {
    // Try to get a non-existent doc to trigger a request
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('api-key-not-valid') || error?.message?.includes('API_KEY_INVALID')) {
      console.error("Firebase API Key is invalid. Please check your configuration.");
    } else if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration and network connection.");
    }
  }
}
testConnection();
