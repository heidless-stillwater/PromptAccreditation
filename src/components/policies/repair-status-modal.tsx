'use client';

import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, XCircle, Activity, ExternalLink, Lock, ArrowRightCircle } from 'lucide-react';
import { getSatelliteAppName } from '@/lib/utils/url-utils';

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
  const [anchoredFrom, setAnchoredFrom] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('sovereign_return_path');
      if (stored) setAnchoredFrom(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appName = getSatelliteAppName(anchoredFrom || '');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#09090b] p-8 border-2 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 overflow-hidden rounded-[2rem]">
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

        <footer className="mt-4 pt-6 border-t border-white/5 flex flex-col gap-4">
          {status === 'success' && (
            <div className="flex flex-col gap-3">
              {anchoredFrom ? (
                <a 
                  href={anchoredFrom}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group animate-in slide-in-from-bottom-2 duration-500"
                >
                  <ArrowRightCircle size={18} className="group-hover:translate-x-1 transition-transform" />
                  RETURN TO {appName.toUpperCase()}
                </a>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-white/30 uppercase font-mono tracking-widest text-center">Manual Return to Suite</p>
                  <div className="flex gap-2">
                    {[
                      { name: 'PromptTool', url: 'http://localhost:3001' },
                      { name: 'PromptResources', url: 'http://localhost:3002' },
                      { name: 'PromptMasterSPA', url: 'http://localhost:5173' }
                    ].map(app => (
                      <a 
                        key={app.name}
                        href={app.url}
                        className="flex-1 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg hover:bg-blue-600 hover:text-white text-center transition-all"
                      >
                        {app.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-3">
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
          </div>
        </footer>
      </div>
    </div>
  );
}
