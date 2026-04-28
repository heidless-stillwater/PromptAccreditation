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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s Clinical Timeout

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

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
    } catch (err: any) {
      console.error('[Auth-V2] Sync error (possibly timeout):', err.message);
      // Fallback to basic firebase user to unblock UI
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
        // CLINICAL TIMEOUT: Prevent redirect check from hanging initialization
        const result = await Promise.race([
          getRedirectResult(auth),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redirect timeout')), 8000))
        ]) as any;

        if (result?.user) {
          console.log('[Auth-V2] Redirect result captured:', result.user.email);
          await syncSession(result.user);
        }
      } catch (err: any) {
        console.error('[Auth-V2] Redirect check error (possibly timeout):', err.message);
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
          fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {}); // Fire and forget
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
  }, [syncSession, authInitialized]);

  // ═══════════════════════════════════════════════════════
  // GLOBAL SAFETY VALVE
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const valve = setTimeout(() => {
        console.warn('[Auth-V2] STATIC_SAFETY_VALVE: DEFCON 1 - Force unlocking UI.');
        setLoading(false);
        setAuthInitialized(true);
        setRedirectChecked(true);
    }, 5000);
    return () => clearTimeout(valve);
  }, []); // Run exactly ONCE on mount. Cannot be reset by state hangs.


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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07080a]">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Synchronizing Sovereign Access</h2>
          <p className="text-sm text-slate-500 font-mono animate-pulse uppercase tracking-widest mb-8 text-center max-w-xs">
            Establishing Link with Ecosystem Hubs...
          </p>
          
          <div className="flex flex-col items-center gap-4">
             <button 
                onClick={() => {
                    setLoading(false);
                    setAuthInitialized(true);
                    setRedirectChecked(true);
                }}
                className="px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
             >
                Force Release UI
             </button>
             <div className="text-[9px] font-mono text-slate-700 uppercase tracking-tighter text-center max-w-xs">
                Sovereign_Shield v2.0.42 // Stabilized_Handshake<br/>
                Warning: Satellite Link Port 3002 may be unresponsive.
             </div>
          </div>

        </div>
      ) : null}

      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
