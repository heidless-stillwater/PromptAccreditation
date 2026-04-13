'use client';

import { useState } from 'react';
import { Zap, Shield, Eye, Lock, Loader2 } from 'lucide-react';
import { setPolicyIntensity } from '@/lib/actions';

type IntensityValue = 'soft' | 'hard' | 'systemic';

export function IntensityDial({ policyId, initialValue }: { policyId: string, initialValue: IntensityValue }) {
  const [intensity, setIntensity] = useState<IntensityValue>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const options: { value: IntensityValue, label: string, icon: any, color: string }[] = [
    { value: 'soft', label: 'Soft AV', icon: Eye, color: 'text-primary' },
    { value: 'hard', label: 'Hard AV', icon: Shield, color: 'text-amber-500' },
    { value: 'systemic', label: 'Systemic', icon: Lock, color: 'text-red-500' }
  ];

  const handleUpdate = async (val: IntensityValue) => {
    if (val === intensity || isPending) return;
    setIsPending(true);
    const res = await setPolicyIntensity(policyId, val);
    if (res.success) {
      setIntensity(val);
    }
    setIsPending(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
          Intensity Dial {isPending && <Loader2 className="animate-spin" size={12} />}
        </label>
        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${options.find(o => o.value === intensity)?.color}`}>
          {intensity}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = intensity === opt.value;
          
          return (
            <button
              key={opt.value}
              onClick={() => handleUpdate(opt.value)}
              disabled={isPending}
              className={`flex flex-col items-center gap-2 py-3 px-2 rounded-lg transition-all
                ${isActive ? 'bg-white/10 shadow-lg border border-white/10' : 'hover:bg-white/5 grayscale opacity-50'}`}
            >
              <Icon size={18} className={isActive ? opt.color : 'text-muted'} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-muted'}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
