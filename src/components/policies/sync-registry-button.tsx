'use client';

import React, { useState } from 'react';
import { RefreshCcw, ShieldCheck, Loader2 } from 'lucide-react';
import { ReconciliationModal } from './reconciliation-modal';
import { ReconciliationStatusModal } from './reconciliation-status-modal';
import { useRouter } from 'next/navigation';

interface Props {
  policyId: string;
  policyName: string;
}

export function SyncRegistryButton({ policyId, policyName }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Status Modal State
  const [statusOpen, setStatusOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error'>('success');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    setIsPending(true);
    try {
      const response = await fetch('/api/compliance/force-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId })
      });

      const result = await response.json();
      setIsModalOpen(false);
      
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage('Sovereign Reconciliation Complete. Mission dossier anchored to the Transparency Portal.');
        setStatusOpen(true);
      } else {
        setSyncStatus('error');
        setSyncMessage(result.message);
        setStatusOpen(true);
      }
    } catch (error: any) {
      setIsModalOpen(false);
      setSyncStatus('error');
      setSyncMessage(error.message);
      setStatusOpen(true);
    } finally {
      setIsPending(false);
    }
  };

  const handleStatusClose = () => {
     setStatusOpen(false);
     // Manual refresh to update the UI data once the modal is closed
     router.refresh();
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        disabled={isPending}
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
          isPending 
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 opacity-50 cursor-not-allowed' 
            : 'bg-white/5 border-white/10 text-white/40 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 group/btn'
        }`}
        title="Force Sync Registry Proof"
      >
        {isPending ? <Loader2 size={12} className="animate-spin text-blue-400" /> : <RefreshCcw size={12} className="group-hover/btn:rotate-180 transition-transform duration-500" />}
        <span className="hidden sm:inline">Force Sync Proof</span>
        
        {/* Sovereign Tooltip */}
        {!isModalOpen && !statusOpen && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-black/90 border border-white/10 backdrop-blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none w-48 text-center shadow-2xl z-50">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 justify-center mb-1 text-blue-400">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-black">REGISTRY_HEALER</span>
                </div>
                <p className="text-[9px] text-white/60 lowercase normal-case leading-snug">
                   Anchors technical certificates for missions that are already Green. Use this to restore the Transparency Portal.
                </p>
             </div>
             <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-white/10 rotate-45 -mt-1" />
          </div>
        )}
      </button>

      <ReconciliationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSync}
        isPending={isPending}
        policyName={policyName}
      />

      <ReconciliationStatusModal 
        isOpen={statusOpen}
        onClose={handleStatusClose}
        status={syncStatus}
        message={syncMessage}
        policyName={policyName}
      />
    </>
  );
}
