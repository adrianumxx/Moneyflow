import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('remixed-') || firebaseConfig.apiKey.includes('API_KEY');

if (isPlaceholder) {
  console.warn('Firebase is using placeholder configuration. Please ensure you have completed the Firebase setup in the AI Studio environment.');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
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
