'use client';

import React, { useState, useTransition } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { EmergencyResetModal } from '@/components/policies/emergency-reset-modal';
import { resetWizardAction } from '@/lib/actions';

interface Props {
  policyId: string;
  policyName: string;
}

export function WizardResetClient({ policyId, policyName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await resetWizardAction(policyId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(`EMERGENCY_RESET_FAILED: ${result.message}`);
        console.error('[Accreditation] Reset failed:', result.message);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500/60 uppercase tracking-widest transition-all"
      >
        <Activity size={12} />
        Emergency_Reset
      </button>

      <EmergencyResetModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        isPending={isPending}
        policyName={policyName}
      />
    </>
  );
}
