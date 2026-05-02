import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, signUpWithEmail, logInWithEmail, signIn, signInRedirect, getRedirectResult, logOut } from '../firebase';
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
      setUser(currentUser);
      
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      if (currentUser.uid.startsWith('demo-')) {
        setLoading(false);
        return;
      }

      // Listen to profile changes with improved stability
      const profileRef = doc(db, 'users', currentUser.uid);
      const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({ uid: docSnap.id, ...data } as UserProfile);
          setLoading(false);
        } else {
          // Confirm missing before creating to avoid race conditions
          try {
            const initialProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Wealth Explorer',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              hasCompletedOnboarding: false,
              plan: 'free'
            };
            await setDoc(profileRef, initialProfile, { merge: true });
            // onSnapshot will pick up the newly created document
          } catch (e) {
            console.error("[AuthContext] Profile initialization failed:", e);
            setLoading(false);
          }
        }
      }, (error) => {
        console.error("[AuthContext] Profile stream error:", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    await setPersistence(auth, browserLocalPersistence);
    if (!isLocal || isMobile) {
      await signInRedirect();
    } else {
      await signIn();
    }
  };

  const signInWithEmail = async (email: string, pass: string, isSignUp: boolean) => {
    await setPersistence(auth, browserLocalPersistence);
    if (isSignUp) {
      await signUpWithEmail(email, pass);
    } else {
      await logInWithEmail(email, pass);
    }
  };

  const signOut = async () => {
    await logOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      signInWithGoogle, 
      signInWithEmail, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
