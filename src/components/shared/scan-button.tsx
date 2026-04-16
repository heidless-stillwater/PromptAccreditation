'use client';

import { useState, useTransition } from 'react';
import { scanSuiteForDrifts } from '@/lib/actions';
import { Search, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export function ScanButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; ticketsRaised?: number; issuesDetected?: string[]; message?: string } | null>(null);

  function handleScan() {
    setResult(null);
    startTransition(async () => {
      const res = await scanSuiteForDrifts();
      setResult(res);
      // Auto-clear after 6s
      setTimeout(() => setResult(null), 6000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleScan}
        disabled={isPending}
        className="btn-ghost flex items-center gap-2 text-sm"
        style={isPending ? { opacity: 0.7 } : {}}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Search size={14} />
        )}
        {isPending ? 'Scanning...' : 'Run Suite Scan'}
      </button>

      {result && (
        <div
          className="animate-fade-in text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-2"
          style={{
            background: result.success
              ? result.issuesDetected?.length
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(16,185,129,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.success ? (result.issuesDetected?.length ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)') : 'rgba(239,68,68,0.25)'}`,
            color: result.success ? (result.issuesDetected?.length ? '#fbbf24' : '#34d399') : '#f87171',
          }}
        >
          {result.success ? (
            result.ticketsRaised ? (
              <>
                <AlertTriangle size={12} />
                {result.ticketsRaised} ticket{result.ticketsRaised !== 1 ? 's' : ''} raised
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                All systems compliant
              </>
            )
          ) : (
            <div className="flex flex-col items-end">
              <span>Scan failed</span>
              {result.message && (
                <span className="text-[10px] opacity-70 mt-0.5">{result.message}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
