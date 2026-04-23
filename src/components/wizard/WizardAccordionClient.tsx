'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Shield, Bot, AlertTriangle } from 'lucide-react';
import { WizardStepClient } from './WizardStepClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Step {
  id: string;
  title: string;
  description: string;
  instructions: string;
  status: string;
  estimatedMinutes?: number;
  automatedProbeId?: string;
  evidenceRequired?: boolean;
  evidenceUrl?: string;
  checklistUrl?: string;
  checklistProgress?: boolean[];
  type?: string;
  isCompleted?: boolean;
  automatable?: boolean;
}

interface Props {
  policyId: string;
  policySlug: string;
  userUid: string;
  initialSteps: Step[];
  remediationActive?: boolean;
  primaryDriftId?: string | null;
}

export function WizardAccordionClient({ policyId, policySlug, userUid, initialSteps, remediationActive, primaryDriftId }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(() => {
    if (remediationActive && primaryDriftId) {
      const idx = initialSteps.findIndex(s => s.id === primaryDriftId);
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Sovereign Mission Header */}
      <header className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-white/10 shadow-2xl mb-10 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <Shield size={120} />
         </div>
         <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
               <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/30 text-[10px] font-bold text-blue-400 uppercase tracking-[0.08em]">
                  Mission_Strategy: Sovereign_Autonomy
               </div>
               <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.08em]">Version_4.0_Stable</div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">Accreditation Roadmap</h2>
            <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
               <span className="text-blue-400 font-bold">Overall Goal:</span> Establishing a comprehensive technical foundation for data autonomy through verifiable audit trails, automated encryption enforcement, and formal regulatory transparency.
            </p>
         </div>
      </header>

      {remediationActive && (
        <div className="mb-10 p-6 glass-card border-red-500/20 glow-danger animate-pulse-slow relative overflow-hidden">
           <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
           <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/10">
                    <AlertTriangle className="text-red-400" size={22} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-gradient-danger uppercase tracking-tight leading-none mb-1">Emergency Remediation Protocol</h3>
                    <p className="text-[10px] text-red-100/40 font-mono font-bold uppercase tracking-[0.08em]">
                       {primaryDriftId ? `Drift Detected in Step: ${primaryDriftId}` : 'Systemic Integrity Breach Detected'}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="space-y-4">
      {initialSteps.map((step, i) => {
        const isExpanded = expandedIndex === i;
        const isCompleted = step.status === 'completed';
        const isLocked = step.status === 'locked';
        const isDrifted = remediationActive && step.id === primaryDriftId;

        return (
          <div key={step.id} className="relative pl-10 group">
            {/* Drift Context */}
             {remediationActive && step.id === primaryDriftId && (
                <div className="absolute -left-20 top-0 bottom-0 flex items-center pr-10">
                   <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-[0.08em] rounded rotate-[-90deg] whitespace-nowrap shadow-lg">
                      Drift_Detected
                   </div>
                </div>
             )}
            {/* Timeline Line */}
            {i !== initialSteps.length - 1 && (
              <div className="absolute left-4 top-10 bottom-0 w-[1px] bg-white/5" />
            )}

            {/* Status Badge */}
            <div 
              onClick={() => !isLocked && setExpandedIndex(isExpanded ? null : i)}
              className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-10 ${
                isCompleted && !isDrifted ? 'bg-green-500/20 border-green-500 text-green-400' :
                isLocked && !isDrifted ? 'bg-white/5 border-white/10 text-white/20' :
                isExpanded || isDrifted ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                'bg-white/10 border-white/20 text-white/40 hover:border-white/40'
              } ${isDrifted ? 'ring-4 ring-red-500/30' : ''}`}
            >
              {isCompleted && !isDrifted ? <CheckCircle2 size={16} /> : isDrifted ? <AlertTriangle size={16} className="text-white animate-pulse" /> : i + 1}
            </div>

            {/* Accordion Card */}
            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isLocked ? 'bg-white/[0.02] border-white/5 opacity-50' : 
              isExpanded ? 'bg-white/[0.06] border-white/20 shadow-2xl ring-1 ring-white/5' :
              'bg-white/[0.03] border-white/5 hover:bg-white/[0.05] cursor-pointer'
            }`}>
              {/* Header (Always Visible) */}
              <div 
                onClick={() => !isLocked && setExpandedIndex(isExpanded ? null : i)}
                className="p-6 flex justify-between items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-base font-bold transition-colors ${
                      isDrifted ? 'text-red-400' : isExpanded ? 'text-white' : 'text-white/70 group-hover:text-white'
                    }`}>
                      {step.title}
                    </h3>
                     {isDrifted && (
                      <span className="badge-red animate-pulse">
                        Drift_Detected
                      </span>
                    )}
                    {isCompleted && !isDrifted && <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-500/40 font-mono">[SIGN-OFF_COMPLETE]</span>}
                    {!isCompleted && !isLocked && !isExpanded && !isDrifted && <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-400/30 font-mono">[ACTIVE_FOCUS_READY]</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                     <p className={`text-sm line-clamp-1 flex-1 ${isDrifted ? 'text-red-200/40' : 'text-white/40'}`}>
                        {isDrifted ? '⚠️ This technical measure has physically drifted from its accredited state.' : step.description}
                     </p>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.05em] whitespace-nowrap ${
                        isDrifted ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-white/5 border border-white/5 text-white/20'
                      }`}>
                         Objective: {step.title === 'Data Audit & Mapping' ? 'PII_ISOLATION' : step.title === 'Encryption Enforcement' ? 'SYSTEMIC_HARDENING' : 'REGULATORY_TRANSPARENCY'}
                      </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="flex gap-2">
                      {step.automatedProbeId && (
                        <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
                          <Bot size={14} />
                        </div>
                      )}
                      {step.status === 'pending' && step.evidenceRequired && (
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                   </div>
                   <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : 'text-white/20'}`}>
                      <ChevronDown size={20} />
                   </div>
                </div>
              </div>

              {/* Collapsible Content */}
              <div className={`transition-all duration-500 ease-in-out ${
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-6 pb-6 pt-0 border-t border-white/5">
                  {/* Implementation Actions (WizardStepClient) */}
                  <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 shadow-inner">
                    <WizardStepClient 
                      policyId={policyId} 
                      policySlug={policySlug}
                      step={{
                        ...step,
                        isCompleted,
                        type: step.type || 'technical'
                      }}
                      draftResult={{
                        content: step.evidenceUrl || '',
                        checklist: step.checklistUrl || ''
                      }}
                      checklistProgress={step.checklistProgress}
                      isDrifted={isDrifted}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
