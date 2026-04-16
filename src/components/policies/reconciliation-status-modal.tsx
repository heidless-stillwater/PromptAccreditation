'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, X, ShieldCheck, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'error';
  message: string;
  policyName: string;
}

export function ReconciliationStatusModal({ isOpen, onClose, status, message, policyName }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isSuccess = status === 'success';

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-95 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto" 
        onClick={onClose} 
      />
      
      {/* Modal Content Container */}
      <div 
        className="relative w-full max-w-md my-auto border rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 z-10"
        style={{ backgroundColor: '#07080a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.15)' }}
      >
        {/* Scrollable Inner Body */}
        <div className="max-h-[85vh] overflow-y-auto thin-scrollbar relative">
          {/* Status Specific Glow */}
          <div className={`absolute inset-0 opacity-10 pointer-events-none ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'} blur-[100px] rounded-full`} />

          <div className="p-10 relative z-10 text-center">
            <header className="flex items-center justify-between mb-8">
              <div 
                className="flex items-center gap-3 px-4 py-2 rounded-full border border-opacity-20"
                style={{ 
                  backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  borderColor: isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  color: isSuccess ? '#34d399' : '#f87171'
                }}
              >
                 {isSuccess ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">
                    {isSuccess ? 'Sync_Complete' : 'Sync_Failed'}
                 </span>
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

            <div className="mb-10 text-center">
               <div 
                 className="mx-auto w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                 style={{ 
                   backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                   color: isSuccess ? '#10b981' : '#ef4444'
                 }}
               >
                  {isSuccess ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
               </div>
               <h2 className="text-2xl font-black tracking-tight mb-2 italic" style={{ color: '#ffffff' }}>
                  {isSuccess ? 'Reconciliation Success' : 'Systemic Failure'}
               </h2>
               <p className="text-[10px] font-black uppercase tracking-widest mb-6" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>{policyName}</p>
               <p className="text-sm leading-relaxed font-medium" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {message}
               </p>
            </div>

            {isSuccess && (
               <div 
                 className="border rounded-2xl p-6 mb-10 text-left"
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
               >
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Registry Artifacts Anchored</h4>
                  <ul className="space-y-3">
                     <li className="flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <ArrowRight size={12} style={{ color: '#10b981' }} />
                        Technical Certification Generated
                     </li>
                     <li className="flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <ArrowRight size={12} style={{ color: '#10b981' }} />
                        Infrastructure Proof Indexed
                     </li>
                     <li className="flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <ArrowRight size={12} style={{ color: '#10b981' }} />
                        Transparency Portal Synchronized
                     </li>
                  </ul>
               </div>
            )}

            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-[0.98]"
              style={{ 
                backgroundColor: isSuccess ? '#ffffff' : '#ef4444', 
                color: isSuccess ? '#000000' : '#ffffff' 
              }}
            >
              {isSuccess ? 'Acknowledge Receipt' : 'Return to Hub'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
