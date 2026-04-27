'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, getRedirectResult, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  syncSession: (user: User) => Promise<void>;
  authInitialized: boolean;
  redirectChecked: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  syncSession: async () => {},
  authInitialized: false,
  redirectChecked: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const router = useRouter();
  const syncInProgress = useRef(false);
  const lastSyncTime = useRef(0);

  const syncSession = useCallback(async (firebaseUser: User) => {
    // Prevent concurrent syncs or rapid fire syncs (within 2 seconds)
    const now = Date.now();
    if (syncInProgress.current || (now - lastSyncTime.current < 2000)) return;
    
    syncInProgress.current = true;
    lastSyncTime.current = now;
    
    console.log('[Auth-V2] Synchronizing session for:', firebaseUser.email);
    try {
      // Use cached token unless expired. Forced refresh can trigger auth state loops.
      const idToken = await firebaseUser.getIdToken(); 
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Auth-V2] Session synced successful.');
        
        const enrichedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: data.profile?.isAdmin || false,
          tier: data.profile?.tier || 'free'
        } as any;
        
        setUser(enrichedUser);
        userRef.current = enrichedUser;
      } else {
        console.warn('[Auth-V2] Session sync failed:', res.status);
        const fallbackUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAdmin: false,
          tier: 'free'
        } as any;
        setUser(fallbackUser);
        userRef.current = fallbackUser;
      }
    } catch (err) {
      console.error('[Auth-V2] Sync error:', err);
      setUser(firebaseUser);
      userRef.current = firebaseUser;
    } finally {
      syncInProgress.current = false;
      setLoading(false);
    }
  }, []);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log('[Auth-V2] AuthProvider initialization sequence starting...');
    
    const checkRedirect = async () => {
      try {
        console.log('[Auth-V2] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('[Auth-V2] Redirect result captured:', result.user.email);
          await syncSession(result.user);
        }
      } catch (err: any) {
        console.error('[Auth-V2] Redirect check error:', err);
      } finally {
        setRedirectChecked(true);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth-V2] onAuthStateChanged fired:', firebaseUser ? firebaseUser.email : 'NONE');
      
      if (firebaseUser) {
        await syncSession(firebaseUser);
      } else {
        const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
        if (authInitialized && !isLoginPage) {
          console.log('[Auth-V2] Clearing session...');
          setUser(null);
          userRef.current = null;
          await fetch('/api/auth/session', { method: 'DELETE' });
        } else {
          setUser(null);
          userRef.current = null;
        }
        setLoading(false);
      }
      setAuthInitialized(true);
    });

    const pollTimer = setInterval(() => {
        if (!userRef.current && auth.currentUser) {
            syncSession(auth.currentUser);
        }
    }, 5000);

    checkRedirect();

    return () => {
        unsubscribe();
        clearInterval(pollTimer);
    };
  }, [syncSession]);

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      setUser(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isGlobalLoading = loading || !authInitialized || !redirectChecked;

  return (
    <AuthContext.Provider value={{ user, loading: isGlobalLoading, signOut, syncSession, authInitialized, redirectChecked }}>
      {mounted && isGlobalLoading && typeof window !== 'undefined' && window.location.pathname !== '/login' ? (
          <div className="fixed inset-0 bg-[#07080a] z-[999] flex flex-col items-center justify-center space-y-6 text-white transition-opacity duration-500">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-center">
                  <p className="font-bold text-lg tracking-tight">Synchronizing Sovereign Access</p>
                  <p className="text-slate-500 text-xs font-mono lowercase tracking-widest mt-2 font-bold">Authenticating with Global Hub...</p>
              </div>
          </div>
      ) : null}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
