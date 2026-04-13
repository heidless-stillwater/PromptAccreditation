'use client';

import { useState } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { scanSuiteForDrifts } from '@/lib/actions';

export function ScanButton() {
  const [isPending, setIsPending] = useState(false);
  const [scanResult, setScanResult] = useState<{ ticketsRaised: number } | null>(null);

  const handleScan = async () => {
    setIsPending(true);
    setScanResult(null);
    try {
      const res = await scanSuiteForDrifts();
      if (res.success && 'ticketsRaised' in res) {
        setScanResult({ ticketsRaised: res.ticketsRaised });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleScan}
        disabled={isPending}
        className="glass-card px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-all border-white/10 group"
      >
        {isPending ? (
          <Loader2 className="text-primary animate-spin" size={16} />
        ) : (
          <Search className="text-primary group-hover:scale-110 transition-transform" size={16} />
        )}
        <span className="text-sm font-medium">
          {isPending ? 'Probing Suite...' : 'Scan for Drifts'}
        </span>
      </button>
      
      {scanResult !== null && (
        <div className="text-[10px] font-mono text-success uppercase bg-success/5 px-2 py-1 rounded border border-success/10 animate-in fade-in slide-in-from-top-1">
          Scan Complete: {scanResult.ticketsRaised} Issues Flagged
        </div>
      )}
    </div>
  );
}
