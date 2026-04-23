'use client';

import React, { useState, useEffect } from 'react';
import { FileDown, Loader2, ShieldCheck, ClipboardCheck, X, CheckSquare, Search, FileText, Download } from 'lucide-react';
import { getDossierDataAction } from '@/lib/actions';
import { generateDossierPDF } from '@/lib/utils/dossier-utils';

interface Props {
  policySlug: string;
}

type ExportStep = 'IDLE' | 'AGGREGATING' | 'VERIFYING' | 'FINALIZING' | 'SUCCESS' | 'ERROR';

export function DossierExportButton({ policySlug }: Props) {
  const [step, setStep] = useState<ExportStep>('IDLE');
  const [lastExported, setLastExported] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setStep('AGGREGATING');
    try {
      // 1. Aggregation Phase
      const result = await getDossierDataAction(policySlug);
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Data aggregation failed');
      }

      await new Promise(r => setTimeout(r, 800)); // Haptic pause
      
      // 2. Verification Phase
      setStep('VERIFYING');
      await new Promise(r => setTimeout(r, 1200)); // Simulated audit verification
      
      // 3. Finalization Phase
      setStep('FINALIZING');
      await generateDossierPDF(result.data);
      await new Promise(r => setTimeout(r, 600));

      setStep('SUCCESS');
      setLastExported(new Date());
    } catch (err) {
      console.error('[DossierExport] Generation Failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Clinical Synthesis Error');
      setStep('ERROR');
    }
  };

  const closeModal = () => setStep('IDLE');

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <button
        onClick={handleExport}
        disabled={step !== 'IDLE'}
        className={`group relative flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all overflow-hidden ${
          step !== 'IDLE' 
            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 cursor-wait' 
            : 'bg-white/5 border border-white/10 text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        {step !== 'IDLE' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span className="animate-pulse">Synthesizing Dossier...</span>
          </>
        ) : (
          <>
            <FileDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
            <span>Export Clinical Dossier</span>
          </>
        )}
      </button>

      {lastExported && (
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/60 uppercase font-mono font-bold animate-in fade-in slide-in-from-top-1">
          <ShieldCheck size={10} />
          Dossier_Signature_Anchored: {lastExported.toLocaleTimeString()}
        </div>
      )}

      {/* PORTAL MODAL OVERLAY */}
      {step !== 'IDLE' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={step === 'SUCCESS' || step === 'ERROR' ? closeModal : undefined} />
          
          <div className="relative w-full max-w-md bg-[#0a0a0b] border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
             {/* Header */}
             <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText size={20} />
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-white leading-none mb-1">Dossier Orchestration</h3>
                      <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.1em]">Clinical Registry Export</p>
                   </div>
                </div>
                {(step === 'SUCCESS' || step === 'ERROR') && (
                   <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                      <X size={16} />
                   </button>
                )}
             </div>

             {/* Content */}
             <div className="p-8">
                <div className="space-y-6">
                   {[
                     { id: 'AGGREGATING', label: 'Audit Log Aggregation', icon: Search },
                     { id: 'VERIFYING', label: 'Cryptographic Verification', icon: CheckSquare },
                     { id: 'FINALIZING', label: 'Dossier Core Generation', icon: FileDown }
                   ].map((item, idx) => {
                      const isActive = step === item.id;
                      const isPast = (step === 'VERIFYING' && idx < 1) || (step === 'FINALIZING' && idx < 2) || step === 'SUCCESS';
                      
                      return (
                        <div key={item.id} className={`flex items-center gap-4 transition-all duration-500 ${isPast ? 'opacity-100' : isActive ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                             isPast ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 
                             isActive ? 'bg-blue-600/20 border-blue-500/30 text-blue-400 animate-pulse' : 
                             'bg-white/5 border-white/10 text-white/20'
                           }`}>
                             {isPast ? <ShieldCheck size={16} /> : <item.icon size={16} />}
                           </div>
                           <span className={`text-sm font-bold ${isPast ? 'text-emerald-400' : isActive ? 'text-white' : 'text-white/20'}`}>
                              {item.label}
                           </span>
                           {isActive && (
                              <div className="ml-auto flex gap-1">
                                 <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" />
                                 <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce delay-100" />
                                 <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce delay-200" />
                              </div>
                           )}
                        </div>
                      );
                   })}
                </div>

                {/* Final State UI */}
                {step === 'SUCCESS' && (
                  <div className="mt-10 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center animate-in slide-in-from-bottom-2">
                     <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                        <Download size={32} />
                     </div>
                     <h4 className="text-white font-bold mb-1">Registry Export Complete</h4>
                     <p className="text-xs text-white/40 mb-5">Your Clinical Dossier has been anchored and is ready for clinical audit.</p>
                     <button onClick={closeModal} className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10">
                        Dismiss Mission
                     </button>
                  </div>
                )}

                {step === 'ERROR' && (
                  <div className="mt-10 p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-center animate-in slide-in-from-bottom-2">
                     <X size={32} className="text-red-400 mx-auto mb-4" />
                     <h4 className="text-white font-bold mb-1">Clinical Synthesis Failed</h4>
                     <p className="text-xs text-red-100/40 mb-5">{errorMessage || 'An internal verification error occurred.'}</p>
                     <button onClick={closeModal} className="w-full py-3 bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all">
                        Retry Mission
                     </button>
                  </div>
                )}
             </div>

             {/* Footer footer */}
             <div className="px-8 py-4 bg-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/20 font-mono uppercase">Sentinel_Audit_V2.1</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none">PHYSICAL_SYNC_ACTIVE</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
