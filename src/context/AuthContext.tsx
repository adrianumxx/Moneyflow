import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, signUpWithEmail, logInWithEmail, signIn, signInRedirect, logOut } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string, isSignUp: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // 1. Update basic user state
      setUser(currentUser);
      
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // 2. Handle Demo Users
      if (currentUser.uid.startsWith('demo-')) {
        setLoading(false);
        return;
      }

      // 3. Robust Profile Sync
      const profileRef = doc(db, 'users', currentUser.uid);
      
      // Try a direct fetch first for faster initial load
      try {
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        } else {
          // Atomic creation if missing
          const initialData = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Wealth Explorer',
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            hasCompletedOnboarding: false,
            plan: 'free'
          };
          await setDoc(profileRef, initialData, { merge: true });
          setUserProfile(initialData as any);
        }
      } catch (e) {
        console.error("[AuthContext] Initial fetch error:", e);
      }

      // 4. Start long-lived listener
      const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        }
        setLoading(false);
      }, (error) => {
        console.error("[AuthContext] Profile sync error:", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence);
    const isLocal = window.location.hostname === 'localhost';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isLocal || isMobile) await signInRedirect();
    else await signIn();
  };

  const signInWithEmail = async (email: string, pass: string, isSignUp: boolean) => {
    await setPersistence(auth, browserLocalPersistence);
    if (isSignUp) await signUpWithEmail(email, pass);
    else await logInWithEmail(email, pass);
  };

  const signOut = async () => {
    await logOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
