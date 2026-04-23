'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect } from 'react';
import { completeWizardStep, skipWizardStep, startWizard } from '@/lib/actions';
import type { Policy, WizardState } from '@/lib/types';
import { CheckCircle2, Lock, ChevronRight, PlayCircle, SkipForward, Sparkles, Shield, Activity, Loader2, Zap } from 'lucide-react';
import { DraftingWizard } from './drafting-wizard';
import { ExemplarModal } from '../wizard/ExemplarModal';

import { RepairStatusModal } from './repair-status-modal';
import { EmergencyResetModal } from './emergency-reset-modal';
import { InteractiveChecklist } from './interactive-checklist';
import { BlueprintEditor } from './blueprint-editor';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  policy: Policy;
  initialWizardState?: WizardState | null;
  userId?: string;
  remediationActive?: boolean;
  primaryDriftId?: string | null;
}

const DRAFTING_STAGES = [
  'Initializing Stillwater AI Core...',
  'Analyzing Policy Framework...',
  'Synthesizing Compliance Evidence...',
  'Formatting Documentation...',
  'Finalizing...'
];

export function WizardPanel({ policy, initialWizardState, userId, remediationActive, primaryDriftId }: Props) {
  const activeUserId = userId || 'local-user';
  const steps = policy.implementationGuide || [];
  const [started, setStarted] = useState(!!initialWizardState);
  const [currentStep, setCurrentStep] = useState(initialWizardState?.stepsCompleted?.length || 0);
  const [completed, setCompleted] = useState<string[]>(initialWizardState?.stepsCompleted || []);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftingStage, setDraftingStage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isPendingPanel, setIsPendingPanel] = useState(false);
  const [isExemplarOpen, setIsExemplarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [repairStatus, setRepairStatus] = useState<'success' | 'error'>('success');
  const [repairMsg, setRepairMsg] = useState('');
  const [viewMode, setViewMode] = useState<'evidence' | 'todo'>('todo');

  // Synchronize on mount if state provided
  useEffect(() => {
    if (initialWizardState) {
      setStarted(true);
      setCompleted(initialWizardState.stepsCompleted || []);
      setCurrentStep(initialWizardState.stepsCompleted?.length || 0);
    }
  }, [initialWizardState]);

  // SOVEREIGN STEERING: Automatic drift focus
  useEffect(() => {
    if (remediationActive && primaryDriftId) {
      const driftIndex = steps.findIndex(s => s.id === primaryDriftId);
      if (driftIndex !== -1) {
        console.log(`[WizardPanel] Steering to drift step: ${primaryDriftId} (Index ${driftIndex})`);
        setCurrentStep(driftIndex);
      }
    }
  }, [remediationActive, primaryDriftId, steps]);

  const activeStep = steps[currentStep] as any;
  const currentEvidence = initialWizardState?.evidenceUploaded?.[activeStep?.id];
  const currentChecklist = initialWizardState?.checklistsUploaded?.[activeStep?.id];

  // Progress Simulator
  useEffect(() => {
    let interval: any;
    if (isPendingPanel) {
      setDraftingStage(0);
      interval = setInterval(() => {
        setDraftingStage((prev) => (prev < DRAFTING_STAGES.length - 1 ? prev + 1 : prev));
      }, 3000);
    } else {
      setDraftingStage(0);
    }
    return () => clearInterval(interval);
  }, [isPendingPanel]);

  function handleStart() {
    startTransition(async () => {
      const res = await startWizard(policy.id, activeUserId);
      if (res.success) {
        setStarted(true);
      } else {
        alert(`MISSION_START_FAILED: ${res.message}`);
      }
    });
  }

  function handleComplete() {
    startTransition(async () => {
      if (!activeStep) return;
      const res = await completeWizardStep(policy.id, activeUserId, activeStep.id);
      if (res.success) {
        setCompleted((prev) => [...prev, activeStep.id]);
        setCurrentStep((i) => Math.min(i + 1, steps.length));
      } else {
        alert(`STEP_COMPLETION_FAILED: ${res.message}`);
      }
    });
  }

  function handleSkip() {
    startTransition(async () => {
      if (!activeStep) return;
      const res = await skipWizardStep(policy.id, activeUserId, activeStep.id);
      if (res.success) {
        setCurrentStep((i) => Math.min(i + 1, steps.length));
      } else {
        alert(`STEP_SKIP_FAILED: ${res.message}`);
      }
    });
  }

  if (!steps.length) return null;

  return (
    <div className={`glass-card p-5 relative overflow-hidden transition-all duration-700 ${remediationActive ? 'border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-2 ring-red-500/20' : ''}`}>
      {remediationActive && (
        <div className="absolute top-0 right-0 p-1 bg-red-500 rounded-bl-lg animate-pulse z-10">
           <Zap size={10} className="text-white" />
        </div>
      )}
      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
        <PlayCircle size={14} style={{ color: 'var(--color-primary)' }} />
        Implementation Wizard
      </h2>

      {!started ? (
        <div>
          <p className="text-xs mb-4" style={{ color: 'var(--secondary)' }}>
            Step-by-step guidance for implementing {policy.name}. {steps.length} steps total.
          </p>
          <button onClick={handleStart} disabled={isPending} className="btn-primary w-full justify-center text-sm font-semibold">
            {isPending ? 'Starting...' : 'Start Wizard'}
          </button>
        </div>
      ) : currentStep >= steps.length ? (
        <div className="text-center py-4">
          <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: 'var(--status-green)' }} />
          <p className="text-sm font-bold" style={{ color: '#34d399' }}>All Steps Complete!</p>
          <p className="text-xs mt-1" style={{ color: 'var(--secondary)' }}>
            {completed.length}/{steps.length} steps completed
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-2 mb-4">
            {steps.map((step, i) => {
              const isDone = completed.includes(step.id);
              const isActive = i === currentStep;
              const isLocked = !isActive && !isDone;
              const isDrifted = primaryDriftId === step.id;

              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`wizard-step-node font-mono ${isDone && !isDrifted ? 'wizard-step-completed' : isActive || isDrifted ? 'wizard-step-active' : 'wizard-step-locked'} ${isDrifted ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                    style={{ width: 26, height: 26, fontSize: 10, background: isDrifted ? 'rgba(239,68,68,0.2)' : undefined, letterSpacing: '0.08em' }}
                  >
                    {isDone && !isDrifted ? <CheckCircle2 size={12} /> : isLocked && !isDrifted ? <Lock size={10} /> : isDrifted ? <Activity size={12} className="text-red-400" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: isDone ? '#34d399' : isActive ? 'var(--foreground)' : 'var(--muted)' }}
                    >
                      {step.title}
                    </p>
                    {isActive && (
                      <p className="text-[10px] truncate" style={{ color: 'var(--secondary)' }}>
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {activeStep && (
            <div
              className="p-3 rounded-xl mb-4"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Step {currentStep + 1}</p>
                
                {(currentEvidence || currentChecklist) && (
                  <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                 <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                    <button 
                      onClick={() => setViewMode('evidence')}
                      className={`px-1.5 py-0.5 text-[8px] font-black rounded-md transition-all ${viewMode === 'evidence' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40'}`}
                    >
                      [DOSSIER]
                    </button>
                    <button 
                      onClick={() => setViewMode('todo')}
                      className={`px-1.5 py-0.5 text-[8px] font-black rounded-md transition-all ${viewMode === 'todo' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40'}`}
                    >
                      [TASKS]
                    </button>
                  </div>
                  </div>
                )}
              </div>

              <h3 className="text-xs font-bold mb-1 text-white">{activeStep.title}</h3>
              
              {viewMode === 'evidence' && currentEvidence ? (
                <div className="py-2 max-h-48 overflow-y-auto thin-scrollbar border-y border-white/5 my-2">
                   <div className="prose prose-invert prose-xs max-w-none text-blue-200/70">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentEvidence}
                      </ReactMarkdown>
                   </div>
                </div>
               ) : viewMode === 'todo' && currentChecklist ? (
                <div className="py-2 max-h-48 overflow-y-auto thin-scrollbar border-y border-white/5 my-2">
                   <InteractiveChecklist 
                     policyId={policy.id}
                     stepId={activeStep.id}
                     checklistRaw={currentChecklist}
                     initialProgress={initialWizardState?.checklistProgress?.[activeStep.id] || []}
                     compact={true}
                   />
                </div>
              ) : (
                <p className="text-[11px] mb-3 text-white/50">{activeStep.guidance}</p>
              )}
              
              <div className="flex items-center gap-2">
                {activeStep.estimatedMinutes && (
                  <p className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    Est. {activeStep.estimatedMinutes} min
                  </p>
                )}
                {activeStep.exemplar && (
                  <button 
                    onClick={() => setIsExemplarOpen(true)}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 ml-auto"
                  >
                    <Shield size={10} />
                    View Ref
                  </button>
                )}
              </div>
            </div>
          )}

          {remediationActive && primaryDriftId === activeStep.id && (
              <div className="mb-4 p-4 glass-card border-red-500/20 glow-danger animate-in slide-in-from-top-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                <div className="flex items-center gap-3 mb-2 relative z-10">
                   <div className="bg-red-500/20 p-1.5 rounded-lg border border-red-500/30">
                      <Zap size={14} className="text-red-400" />
                   </div>
                   <p className="text-[10px] font-bold text-gradient-danger uppercase tracking-[0.08em]">Drift Intervention Required</p>
                </div>
                <p className="text-[10px] text-red-100/40 leading-relaxed mb-4 relative z-10 font-medium">
                   This implementation step has drifted from the clinical registry. Restore integrity to release the Sovereign Lock.
                </p>
                <button 
                  onClick={async () => {
                    const { remediatePolicyAction } = await import('@/lib/actions');
                    startTransition(async () => {
                       const res = await remediatePolicyAction(policy.slug);
                       if (res.success) {
                          setRepairMsg(res.message);
                          setRepairStatus('success');
                          setIsModalOpen(true);
                       } else {
                          setRepairMsg(res.message);
                          setRepairStatus('error');
                          setIsModalOpen(true);
                       }
                    });
                  }}
                  disabled={isPending}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold uppercase tracking-[0.1em] text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 relative z-10"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                  RESTORE INTEGRITY
                </button>
             </div>
          )}

          {isPendingPanel && (
            <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-2 animate-in slide-in-from-top-1">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-blue-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{DRAFTING_STAGES[draftingStage]}</span>
                  </div>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-blue-500/50 transition-all duration-500" 
                   style={{ width: `${((draftingStage + 1) / DRAFTING_STAGES.length) * 100}%` }} 
                 />
               </div>
            </div>
          )}

          <ExemplarModal 
            isOpen={isExemplarOpen}
            onClose={() => setIsExemplarOpen(false)}
            title={activeStep.title}
            content={activeStep.exemplar || ''}
          />

          <div className="flex flex-col gap-2">
            {(activeStep.draftable || activeStep.evidenceRequired) && !isDrafting && !isPendingPanel && (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={async () => {
                    setIsPendingPanel(true);
                    try {
                      const { draftEvidenceAction } = await import('@/lib/actions');
                      const result = await draftEvidenceAction(policy.id, activeStep.id) as any;
                      if (result.success && result.content) {
                        await completeWizardStep(policy.id, activeUserId, activeStep.id, result.content, result.checklist);
                        setCompleted((prev) => [...prev, activeStep.id]);
                        setCurrentStep((i) => Math.min(i + 1, steps.length));
                      }
                    } catch (err) {
                      console.error('Sidebar drafting failed:', err);
                    } finally {
                      setIsPendingPanel(false);
                    }
                  }}
                  disabled={isPendingPanel}
                  className={`btn-primary w-full justify-center text-sm py-3 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 transition-all ${remediationActive ? 'ring-2 ring-white animate-pulse-slow' : ''}`}
                >
                  <Sparkles size={14} className="animate-pulse" />
                  {remediationActive ? 'Auto-Remediate with Stillwater AI' : 'Draft Evidence with Stillwater AI'}
                </button>
              </div>
            )}

            {!isDrafting && !isPendingPanel && (
              <div className="flex flex-col gap-2">
                {/* Auto-Repair Shortcuts */}
                {(activeStep.id === 'dpa-step-2' || activeStep.id === 'encryption-enforcement') && (
                  <button 
                    onClick={async () => {
                      const { triggerEncryptionRepair } = await import('@/lib/actions');
                      startTransition(async () => {
                        const result = await triggerEncryptionRepair(policy.id);
                        if (result.success) {
                          setCompleted((prev) => [...prev, activeStep.id]);
                          setCurrentStep((i) => Math.min(i + 1, steps.length));
                          setRepairMsg('Systemic encryption has been enforced. All field-level data in the Master Registry is now secured.');
                          setRepairStatus('success');
                          setIsModalOpen(true);
                        } else {
                          setRepairMsg(result.message);
                          setRepairStatus('error');
                          setIsModalOpen(true);
                        }
                      });
                    }}
                    disabled={isPending}
                    className="btn-ghost !bg-emerald-500/10 hover:!bg-emerald-500/20 !border-emerald-500/30 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400 py-3 border tracking-[0.08em] animate-pulse-slow mb-1 uppercase font-mono"
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                    AUTO-REPAIR SYSTEMS
                  </button>
                )}

                {activeStep.id === 'osa-step-3' && (
                  <button 
                    onClick={async () => {
                      const { triggerAVGatewayRepair } = await import('@/lib/actions');
                      startTransition(async () => {
                        const result = await triggerAVGatewayRepair(policy.id);
                        if (result.success) {
                          setCompleted((prev) => [...prev, activeStep.id]);
                          setCurrentStep((i) => Math.min(i + 1, steps.length));
                          setRepairMsg('AV Gateway has been technically enforced. Age verification is now active across all satellite nodes.');
                          setRepairStatus('success');
                          setIsModalOpen(true);
                        } else {
                          setRepairMsg(result.message);
                          setRepairStatus('error');
                          setIsModalOpen(true);
                        }
                      });
                    }}
                    disabled={isPending}
                    className="btn-ghost !bg-emerald-500/10 hover:!bg-emerald-500/20 !border-emerald-500/30 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400 py-3 border tracking-[0.08em] animate-pulse-slow mb-1 uppercase font-mono"
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                    AUTO-REPAIR SYSTEMS
                  </button>
                )}

                {activeStep.id === 'osa-step-4' && (
                  <button 
                    onClick={async () => {
                      const { triggerModerationRepair } = await import('@/lib/actions');
                      startTransition(async () => {
                        const result = await triggerModerationRepair(policy.id);
                        if (result.success) {
                          setCompleted((prev) => [...prev, activeStep.id]);
                          setCurrentStep((i) => Math.min(i + 1, steps.length));
                          setRepairMsg('Content Moderation has been technically enforced. Automated flagging and AI screening are now active.');
                          setRepairStatus('success');
                          setIsModalOpen(true);
                        } else {
                          setRepairMsg(result.message);
                          setRepairStatus('error');
                          setIsModalOpen(true);
                        }
                      });
                    }}
                    disabled={isPending}
                    className="btn-ghost !bg-emerald-500/10 hover:!bg-emerald-500/20 !border-emerald-500/30 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400 py-3 border tracking-[0.08em] animate-pulse-slow mb-1 uppercase font-mono"
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                    AUTO-REPAIR SYSTEMS
                  </button>
                )}

                <div className="flex gap-2">
                  <button onClick={handleComplete} disabled={isPending} className="btn-success flex-1 justify-center text-sm">
                    <CheckCircle2 size={13} />
                    {isPending ? '...' : 'Mark Done'}
                  </button>
                  <button onClick={handleSkip} disabled={isPending} className="btn-ghost text-sm flex items-center gap-1">
                    <SkipForward size={13} />
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5">
        <Link
          href={`/policies/${policy.slug}/wizard`}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-white/30 hover:text-white/60 transition-all"
        >
          Full Wizard <ChevronRight size={10} />
        </Link>
        
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-500/40 hover:text-red-500 transition-all underline decoration-dotted"
        >
          <Activity size={10} />
          Emergency_Reset
        </button>
      </div>

      {/* SOVEREIGN DIAGNOSTICS */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
         <div className="flex items-center justify-between text-[10px] font-mono text-white/20 uppercase tracking-[0.08em]">
            <span>Authenticated_As</span>
            <span className="text-blue-400 font-bold">local-user</span>
         </div>
         <div className="flex items-center justify-between text-[10px] font-mono text-white/20 uppercase tracking-[0.08em]">
            <span>System_Ref_ID</span>
            <span className="text-white/40 font-bold">{policy.id.substring(0, 12)}...</span>
         </div>
         <div className="p-2 rounded bg-black/40 border border-white/5 text-[9px] font-mono text-emerald-500/40 break-all tracking-[0.05em]">
            Last_Action: {completed.length > 0 ? `Completed_${completed[completed.length-1]}` : 'Ready_to_Start'}
         </div>
      </div>

      <EmergencyResetModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={async () => {
          const { resetWizardAction } = await import('@/lib/actions');
          startTransition(async () => {
            const res = await resetWizardAction(policy.id);
            if (res.success) {
              window.location.reload();
            } else {
              setRepairMsg(`EMERGENCY_OVERRIDE_FAILED: ${res.message}`);
              setRepairStatus('error');
              setIsModalOpen(true);
              setIsResetModalOpen(false);
            }
          });
        }}
        isPending={isPending}
        policyName={policy.name}
      />

      <RepairStatusModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={repairStatus}
        message={repairMsg}
        details={repairStatus === 'success' ? {
          action: 'AES-256-GCM Direct Enforcement',
          standard: 'Field-Level Symmetric Encryption',
          impact: 'UK GDPR / DPIA Compliance Alignment'
        } : undefined}
      />
    </div>
  );
}
