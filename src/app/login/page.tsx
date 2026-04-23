'use client';

import { useState, useEffect, Suspense } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Shield, Lock, Activity } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

function LoginContent() {
  const { user, loading: authLoading, syncSession, authInitialized, redirectChecked } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Debug Polling for UI
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<string | null>(null);
  useEffect(() => {
     const timer = setInterval(() => {
        setCurrentFirebaseUser(auth.currentUser ? auth.currentUser.email : 'NONE');
     }, 1000);
     return () => clearInterval(timer);
  }, []);

  console.log(`[Auth-V2][Render] user: ${user ? user.email : 'NONE'}, loading: ${authLoading}`);

  // Auto-redirect... (previous logic)
  useEffect(() => {
    if (!authLoading && user) {
      const safeTarget = (callbackUrl === '/login' || !callbackUrl) ? '/' : callbackUrl;
      const timer = setTimeout(() => { window.location.href = safeTarget; }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, callbackUrl]);

  const handleLogin = async (usePopup = false) => {
    setLoading(true);
    setError(null);
    try {
      const isLive = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
      if (isLive && !usePopup) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('[Auth-V2] Popup Success. Manual Syncing...');
        await syncSession(result.user);
      }
    } catch (err: any) {
      console.error('[Auth-V2] Login Error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#07080a]">
      {/* Debug Panel */}
      <div className="fixed bottom-4 left-4 z-[999] p-3 bg-black/80 border border-white/10 rounded-lg font-mono text-[9px] text-blue-400 space-y-1 backdrop-blur-md">
         <div className="text-white/40 uppercase font-bold tracking-tighter mb-1 border-b border-white/10 pb-1 flex justify-between gap-4">
            <span>Sovereign_Debug</span>
            <span className="text-blue-500">v2.0.9</span>
         </div>
         <div>SDK_USER: <span className={currentFirebaseUser !== 'NONE' ? 'text-emerald-400' : ''}>{currentFirebaseUser}</span></div>
         <div>APP_USER: <span className={user ? 'text-emerald-400' : ''}>{user ? user.email : 'NONE'}</span></div>
         <div>INIT: <span>{authInitialized ? 'TRUE' : 'WAIT'}</span> | REDIR: <span>{redirectChecked ? 'DONE' : 'WAIT'}</span></div>
         <div>LOAD: <span>{authLoading ? 'TRUE' : 'FALSE'}</span></div>
         <div className="border-t border-white/5 pt-1 mt-1 opacity-60">
            <div>DOMAIN: <span className="text-[8px]">{auth.app.options.authDomain || 'MISSING'}</span></div>
            <div>KEY: <span className="text-[8px]">{auth.app.options.apiKey?.slice(0, 10)}...</span></div>
         </div>
         {auth.currentUser && !user && (
            <button 
                onClick={() => syncSession(auth.currentUser!)}
                className="mt-2 w-full py-1 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 rounded text-blue-400 font-bold uppercase transition-all"
            >
                Force manual sync
            </button>
         )}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass-card p-10 w-full max-w-md relative z-10 text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30">
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-2 tracking-tight">
          Prompt<span className="text-gradient-primary">Accreditation</span>
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          The Active Policy Controller for the Prompt Suite
        </p>
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={() => handleLogin(true)}
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-3 text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded-full p-1" alt="" />
          )}
          {loading ? 'Authenticating...' : 'Sign in with Google'}
        </button>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => handleLogin(false)}
            disabled={loading}
            className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest font-bold"
          >
            Switch to Redirect Login
          </button>
        </div>
        
        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/5 pt-10">
          <div className="flex flex-col items-center gap-1">
            <Shield size={16} className="text-blue-400 opacity-60" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Safety</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Lock size={16} className="text-amber-400 opacity-60" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Privacy</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Activity size={16} className="text-emerald-400 opacity-60" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Security</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-[11px] font-mono text-slate-600 tracking-wider flex flex-col items-center gap-1">
        <span>ACTIVE POLICY CONTROLLER // V2.0.0</span>
        <span className="text-blue-500/50">BUILD_STATE: v2.0.28-SOVEREIGN_STABLE</span>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#07080a]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
