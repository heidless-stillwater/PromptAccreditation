'use client';

import React from 'react';
import { AlertTriangle, XCircle, RefreshCcw, ShieldAlert, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  policyName: string;
}

export function EmergencyResetModal({ isOpen, onClose, onConfirm, isPending, policyName }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg glass-card p-8 border-2 border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.1)] flex flex-col gap-6 overflow-hidden">
        {/* Warning Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
        
        <header className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sovereign Override: State Wipe
            </h2>
            <p className="text-[10px] text-red-500/60 uppercase tracking-widest font-black mt-1">
              Destructive_Admin_Action_Requested
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <p className="text-sm text-white/80 leading-relaxed">
              You are about to purge all implementation progress for <span className="font-black text-white underline decoration-red-500/40 decoration-2">{policyName}</span>.
            </p>
          </div>

          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Wipe_Manifest</h4>
             <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                   <AlertTriangle className="w-3 h-3 text-amber-500/50" />
                   <span className="text-[10px] text-white/60 font-mono">PURGE_AI_EVIDENCE_DRAFTS</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                   <AlertTriangle className="w-3 h-3 text-amber-500/50" />
                   <span className="text-[10px] text-white/60 font-mono">PURGE_BIMODAL_BLUEPRINTS</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                   <AlertTriangle className="w-3 h-3 text-amber-500/50" />
                   <span className="text-[10px] text-white/60 font-mono">RESET_STEP_SIGN_OFFS</span>
                </div>
             </div>
          </div>

          <p className="text-[10px] text-white/30 italic">
            * This action is systemic and irreversible. All accreditation state for this policy will be returned to the "Start Wizard" baseline.
          </p>
        </div>

        <footer className="mt-4 pt-6 border-t border-white/5 flex gap-3">
          <button 
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
          >
            Maintain Current State
          </button>
          <button 
             onClick={onConfirm}
             disabled={isPending}
             className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 group border-b-4 border-red-800"
          >
            {isPending ? <RefreshCcw size={14} className="animate-spin" /> : <Trash2 size={14} className="group-hover:animate-bounce" />}
            {isPending ? 'WIPING...' : 'PERFORM STATE WIPE'}
          </button>
        </footer>
      </div>
    </div>
  );
}
