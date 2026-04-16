'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Shield, Lock, Activity } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Sync session
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      if (res.ok) {
        router.refresh();
        router.push(callbackUrl);
      } else {
        setError('Failed to establish session.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#07080a]">
      {/* Ambient background glow */}
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
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-3 text-base shadow-blue-500/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 bg-white rounded-full p-1" alt="" />
          )}
          {loading ? 'Authenticating...' : 'Sign in with Google'}
        </button>
        
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
      
      <div className="absolute bottom-8 text-[11px] font-mono text-slate-600 tracking-wider">
        ACTIVE POLICY CONTROLLER // V2.0.0
      </div>
    </main>
  );
}
