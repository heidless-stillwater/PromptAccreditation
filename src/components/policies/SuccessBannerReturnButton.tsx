'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRightCircle } from 'lucide-react';
import { getSatelliteAppName } from '@/lib/utils/url-utils';

interface SuccessBannerReturnButtonProps {
  initialFromUrl: string | null;
}

/**
 * SuccessBannerReturnButton - A client-side button that reads the anchored origin
 * to provide a return path even if searchParams are lost.
 */
export function SuccessBannerReturnButton({ initialFromUrl }: SuccessBannerReturnButtonProps) {
  const [anchoredUrl, setAnchoredUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sovereign_return_path');
    if (stored) setAnchoredUrl(stored);
  }, []);

  const finalUrl = initialFromUrl || anchoredUrl;
  const appName = finalUrl ? getSatelliteAppName(finalUrl) : null;

  // MISSION FALLBACK: If no origin is pinned, show a "Return to Suite" menu
  if (!finalUrl) {
    return (
      <div className="flex flex-col gap-2 items-end">
        <p className="text-[9px] text-emerald-400/40 uppercase font-mono tracking-widest mb-1 italic">Unknown Mission Origin • Manual Return Enabled</p>
        <div className="flex items-center gap-2">
           {[
             { name: 'PromptTool', url: 'http://localhost:3001' },
             { name: 'PromptResources', url: 'http://localhost:3002' },
             { name: 'PromptMasterSPA', url: 'http://localhost:5173' }
           ].map(app => (
             <a 
               key={app.name}
               href={app.url}
               className="px-3 py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600 hover:text-white text-blue-400 text-[10px] font-bold rounded-lg transition-all uppercase tracking-tighter"
             >
               {app.name}
             </a>
           ))}
        </div>
      </div>
    );
  }

  return (
    <a 
      href={finalUrl}
      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-3 animate-in slide-in-from-right-4 duration-500"
    >
      <ArrowRightCircle size={18} className="animate-pulse" />
      RETURN TO {appName?.toUpperCase()}
    </a>
  );
}
