'use client';

import { useState, useTransition } from 'react';
import { triggerActiveFix } from '@/lib/actions';
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface FixButtonProps {
  ticketId: string;
  fixId?: string;
  disabled?: boolean;
}

export function FixButton({ ticketId, fixId, disabled }: FixButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!fixId) {
    return (
      <button disabled className="btn-ghost text-sm opacity-40 cursor-not-allowed flex items-center gap-2">
        <Zap size={14} />
        No Automated Fix
      </button>
    );
  }

  if (disabled) {
    return (
      <button disabled className="btn-ghost text-sm opacity-40 cursor-not-allowed flex items-center gap-2">
        <Zap size={14} />
        Active Fix (Upgrade)
      </button>
    );
  }

  function handleFix() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setResult(null);
    setConfirmed(false);
    startTransition(async () => {
      const res = await triggerActiveFix(ticketId);
      setResult(res);
    });
  }

  if (result?.success) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium animate-fade-in" style={{ color: '#34d399' }}>
        <CheckCircle2 size={14} />
        Fix Applied
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFix}
        disabled={isPending}
        className={confirmed ? 'btn-danger text-sm flex items-center gap-2' : 'btn-primary text-sm flex items-center gap-2'}
        style={isPending ? { opacity: 0.7 } : {}}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Zap size={14} />
        )}
        {isPending ? 'Applying...' : confirmed ? 'Confirm Fix?' : 'Active Fix'}
      </button>

      {confirmed && !isPending && (
        <button
          onClick={() => setConfirmed(false)}
          className="btn-ghost text-sm flex items-center gap-1"
        >
          <XCircle size={14} />
          Cancel
        </button>
      )}

      {result && !result.success && (
        <span className="text-xs font-mono" style={{ color: '#f87171' }}>
          {result.message}
        </span>
      )}
    </div>
  );
}
