// ---------------------------------------------------------------------------
// Auth context: Firebase — Google sign-in only. No passwords are ever handled
// by us. Signing in is OPTIONAL — the game is fully playable signed-out
// ("guest"). `user === null` means the player is a guest.
// ---------------------------------------------------------------------------
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

interface AuthValue {
  user: User | null;
  signedIn: boolean;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Update the signed-in user's Google/Firebase display name. */
  updateDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('auth-unavailable');
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const updateDisplayName = async (name: string) => {
    if (auth?.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser({ ...auth.currentUser } as User); // nudge React to re-read displayName
    }
  };

  const signOut = async () => {
    if (auth && user) await firebaseSignOut(auth);
  };

  const value: AuthValue = {
    user,
    signedIn: Boolean(user),
    loading,
    configured: isFirebaseConfigured,
    signInWithGoogle,
    updateDisplayName,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
