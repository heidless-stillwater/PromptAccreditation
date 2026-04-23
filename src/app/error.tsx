'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Global_Error_Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0b]">
      <div className="glass-card max-w-md w-full p-8 text-center animate-fade-in border-red-500/20">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldAlert className="text-red-500" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-white">System Encountered a Fault</h1>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          The Accreditation Controller experienced a module crash. Data links may be temporarily unstable.
        </p>

        {error.digest && (
          <div className="mb-8 px-3 py-2 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-white/40">
            Fault ID: {error.digest}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all text-sm"
          >
            <RefreshCcw size={16} />
            Attempt Recovery
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 text-white/80 font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all text-sm"
          >
            <Home size={16} />
            Return to Dashboard
          </Link>
        </div>
        
        <p className="mt-8 text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">
          Sovereign Registry Integrity Protected
        </p>
      </div>
    </div>
  );
}
