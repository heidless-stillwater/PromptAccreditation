'use client';

import React from 'react';
import { Shield, CheckCircle2, XCircle, Activity, ExternalLink, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'error';
  message: string;
  details?: {
    action: string;
    standard: string;
    impact: string;
  };
}

export function RepairStatusModal({ isOpen, onClose, status, message, details }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#09090b] p-8 border-2 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 overflow-hidden">
        {/* Background circuit glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />
        
        <header className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${
            status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}>
            {status === 'success' ? (
              <Shield className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {status === 'success' ? 'Systemic Repair Successful' : 'Remediation Failure'}
            </h2>
            <p className="text-xs text-white/40 uppercase tracking-widest font-mono mt-1">
              Active_Controller_Action_Response
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              {message}
            </p>
            
            {details && (
              <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-white/40 uppercase">Enforcement_Action</span>
                  <span className="text-emerald-400">{details.action}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-white/40 uppercase">Crypto_Standard</span>
                  <span className="text-emerald-400">{details.standard}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-white/40 uppercase">Policy_Impact</span>
                  <span className="text-blue-400">{details.impact}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400/60 uppercase tracking-tighter">
              <Activity size={12} className="animate-pulse" />
              Audit_Log_Updated: probe-encryption-enforcement
            </div>
            <p className="text-[9px] text-white/20 italic">
              Verification signatures broadcast to all satellite registries.
            </p>
          </div>
        </div>

        <footer className="mt-4 pt-6 border-t border-white/5 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
          >
            Acknowledge & Close
          </button>
          <button 
             onClick={() => window.location.reload()}
             className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Lock size={14} />
            Verify Dashboard
          </button>
        </footer>
      </div>
    </div>
  );
}
