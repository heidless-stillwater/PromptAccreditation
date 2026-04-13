'use client';

import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { triggerActiveFix } from '@/lib/actions';

export function FixButton({ ticketId }: { ticketId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFix = async () => {
    setIsPending(true);
    setResult(null);
    try {
      const res = await triggerActiveFix(ticketId);
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, message: 'Unexpected error occurred.' });
    } finally {
      setIsPending(false);
    }
  };

  if (result?.success) {
    return (
      <div className="flex items-center gap-2 text-success font-bold text-xs">
        <Zap size={14} fill="currentColor" /> Remediation Complete
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleFix}
        disabled={isPending}
        className="px-4 py-2 bg-primary rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
        {isPending ? 'Executing Fix...' : 'Trigger Active Fix'}
      </button>
      {result && !result.success && (
        <span className="text-[10px] text-danger font-medium">{result.message}</span>
      )}
    </div>
  );
}
