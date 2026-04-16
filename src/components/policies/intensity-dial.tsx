'use client';

import { useState, useTransition } from 'react';
import { setPolicyIntensity } from '@/lib/actions';
import type { IntensityLevel } from '@/lib/types';

const DIAL_OPTIONS: { value: IntensityLevel; label: string; description: string; color: string }[] = [
  { value: 'soft',     label: 'Soft',     description: 'Self-declaration only',                color: '#60a5fa' },
  { value: 'hard',     label: 'Hard',     description: 'DOB validation + session gate',        color: '#fbbf24' },
  { value: 'systemic', label: 'Systemic', description: 'Full cross-app enforcement push',      color: '#f87171' },
];

interface Props {
  policyId: string;
  current: IntensityLevel;
}

export function IntensityDialClient({ policyId, current }: Props) {
  const [selected, setSelected] = useState<IntensityLevel>(current);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(val: IntensityLevel) {
    if (val === selected) return;
    setSelected(val);
    setSaved(false);
    startTransition(async () => {
      await setPolicyIntensity(policyId, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div>
      <div className="dial-track">
        {DIAL_OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              disabled={isPending}
              className={`dial-segment dial-${opt.value} ${isActive ? 'active' : ''}`}
              title={opt.description}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs" style={{ color: 'var(--secondary)' }}>
        {DIAL_OPTIONS.find((o) => o.value === selected)?.description}
        {isPending && <span className="ml-2 opacity-60">Saving...</span>}
        {saved && <span className="ml-2" style={{ color: '#34d399' }}>✓ Saved</span>}
      </div>
      {selected === 'systemic' && (
        <div
          className="mt-3 text-xs px-3 py-2 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          ⚡ Systemic mode will push enforcement config to all affected apps via Active Controller.
        </div>
      )}
    </div>
  );
}
