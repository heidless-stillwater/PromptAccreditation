'use client';

import React, { useTransition } from 'react';
import { Shield, Loader2, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import { remediatePolicyAction } from '@/lib/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSatelliteAppName } from '@/lib/utils/url-utils';

interface RestorationButtonClientProps {
  policySlug: string;
  originUrl?: string | null;
  className?: string;
}

/**
 * RestorationButtonClient - A high-fidelity trigger for suite-wide remediation.
 */
export function RestorationButtonClient({ policySlug, originUrl, className }: RestorationButtonClientProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [anchoredFrom, setAnchoredFrom] = React.useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 1. Unified Origin Detection
  const from = originUrl || searchParams.get('from') || anchoredFrom;
  const appName = getSatelliteAppName(from);

  // 2. Client-side anchor retrieval
  React.useEffect(() => {
    const stored = localStorage.getItem('sovereign_return_path');
    if (stored) setAnchoredFrom(stored);
  }, []);

  const handleRestore = () => {
    startTransition(async () => {
      console.log(`[RestorationButtonClient] Initiating suite-wide restoration for: ${policySlug}`);
      const res = await remediatePolicyAction(policySlug);
      
      if (res.success) {
        setIsSuccess(true);
        // Delay redirect slightly to show success state
        setTimeout(() => {
          const returnParam = from ? `&from=${encodeURIComponent(from)}` : '';
          router.push(`/policies/${policySlug}?remediate=true${returnParam}`);
          router.refresh();
        }, 1200);
      } else {
        alert(`RESTORATION_FAILED: ${res.message}`);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="flex items-center gap-3 animate-in zoom-in-95 duration-500">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest">
           <Shield size={14} /> Integrity Restored
        </div>
        
        {from ? (
          <a 
            href={from}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 group"
          >
            <ArrowRightCircle size={16} className="group-hover:translate-x-1 transition-transform" />
            RETURN TO {appName.toUpperCase()}
          </a>
        ) : (
          <div className="flex items-center gap-2">
            {[
              { name: 'PromptTool', url: 'http://localhost:3001' },
              { name: 'PromptResources', url: 'http://localhost:3002' },
              { name: 'PromptMasterSPA', url: 'http://localhost:5173' }
            ].map(app => (
              <a 
                key={app.name}
                href={app.url}
                className="px-3 py-2 bg-blue-600/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all"
              >
                {app.name}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={handleRestore}
      disabled={isPending}
      className={`px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isPending ? 'opacity-80 cursor-not-allowed' : 'animate-pulse-slow glow-danger'} ${className}`}
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Restoring...
        </>
      ) : (
        <>
          <Shield size={16} />
          Restore System Integrity
        </>
      )}
    </button>
  );
}
