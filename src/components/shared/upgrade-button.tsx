'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';

interface UpgradeButtonProps {
  priceId: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

export function UpgradeButton({ priceId, label, className, style }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('[Upgrade] Error:', err);
      alert('Failed to initialize checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={className}
      style={style}
    >
      <Zap size={14} className={`${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Initializing...' : label}
    </button>
  );
}
