'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCcw, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  policyName: string;
}

export function ReconciliationModal({ isOpen, onClose, onConfirm, isPending, policyName }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-95 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" 
        onClick={onClose} 
      />
      
      {/* Modal Content Container */}
      <div 
        className="relative w-full max-w-lg my-auto border rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 z-10"
        style={{ backgroundColor: '#07080a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)' }}
      >
        {/* Scrollable Inner Body */}
        <div className="max-h-[85vh] overflow-y-auto thin-scrollbar relative">
          {/* Glow Decor */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600 bg-opacity-10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600 bg-opacity-10 blur-[80px] rounded-full pointer-events-none" />

          <div className="p-8 sm:p-12 relative z-10">
            <header className="flex items-center justify-between mb-8">
              <div 
                className="flex items-center gap-3 px-4 py-2 rounded-full border border-opacity-30"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}
              >
                 <ShieldCheck size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Registry_Healer</span>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full transition-colors"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                aria-label="Close"
              >
                 <X size={20} />
              </button>
            </header>

            <div className="mb-10 text-left">
              <h2 className="text-2xl font-black tracking-tight mb-4" style={{ color: '#ffffff' }}>
                 Force Registry Reconciliation?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                 This utility will audit your existing infrastructure for <span className="font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{policyName}</span>. 
                 If your mission is already green but documentation is missing, the system will anchor high-fidelity technical proof to your dossier.
              </p>
            </div>

            <div className="space-y-4 mb-10 text-left">
               <div 
                 className="flex items-start gap-4 p-4 rounded-2xl border"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
               >
                  <div className="mt-1" style={{ color: '#10b981' }}>
                     <CheckCircle2 size={16} />
                  </div>
                  <div>
                     <h4 className="text-xs font-bold mb-1" style={{ color: '#ffffff' }}>Dossier Recovery</h4>
                     <p className="text-[10px] leading-snug" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Recover synthesized policies orphaned by registry migrations.</p>
                  </div>
               </div>
               <div 
                 className="flex items-start gap-4 p-4 rounded-2xl border"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.08)' }}
               >
                  <div className="mt-1" style={{ color: '#3b82f6' }}>
                     <RefreshCcw size={16} />
                  </div>
                  <div>
                     <h4 className="text-xs font-bold mb-1" style={{ color: '#ffffff' }}>Proof Calibration</h4>
                     <p className="text-[10px] leading-snug" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Verify all 100+ system controls and anchor them to the public transparency portal.</p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={onConfirm}
                 disabled={isPending}
                 className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                 style={{ backgroundColor: '#ffffff', color: '#000000' }}
               >
                 {isPending ? (
                   <>
                     <RefreshCcw size={16} className="animate-spin" />
                     Synchronizing...
                   </>
                 ) : (
                   'Execute Reconciliation'
                 )}
               </button>
               <button 
                 onClick={onClose}
                 disabled={isPending}
                 className="w-full py-4 text-[10px] font-black uppercase tracking-widest transition-colors"
                 style={{ color: 'rgba(255, 255, 255, 0.25)' }}
               >
                 Cancel Override
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
