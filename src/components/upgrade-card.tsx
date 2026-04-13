'use client';

import { useState } from 'react';
import { Crown, Check, Loader2, CreditCard } from 'lucide-react';

export function UpgradeCard() {
  const [isPending, setIsPending] = useState(false);

  const handleUpgrade = async () => {
    setIsPending(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_accreditation_pro',
          successUrl: window.location.origin + '/?success=true',
          cancelUrl: window.location.origin + '/?cancel=true',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="glass-card p-8 border-primary/20 bg-primary/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Crown size={80} className="text-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Crown size={20} />
          </div>
          <h3 className="text-xl font-bold italic tracking-tight">Accreditation <span className="text-white">Pro</span></h3>
        </div>

        <p className="text-sm text-secondary mb-6 max-w-sm font-medium">
          Unlock the <span className="text-white">Active Controller</span> engine for suite-wide automated remediation and real-time drift monitoring.
        </p>

        <ul className="space-y-3 mb-8">
          {['Active Fix Remediations', 'Systemic Policy Locks', 'Advanced Drift Detection Probes', 'Regulatory Evidence Archive'].map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-xs text-secondary">
              <Check size={14} className="text-success" /> {feat}
            </li>
          ))}
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={isPending}
          className="w-full py-3 bg-primary rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all shadow-glow shadow-primary/20"
        >
          {isPending ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
          {isPending ? 'Preparing Checkout...' : 'Upgrade Now — £29/mo'}
        </button>
      </div>
    </div>
  );
}
