'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect } from 'react';
import { completeWizardStep, skipWizardStep, startWizard } from '@/lib/actions';
import type { Policy, WizardState } from '@/lib/types';
import { CheckCircle2, Lock, ChevronRight, PlayCircle, SkipForward, Sparkles, Shield, Activity, Loader2 } from 'lucide-react';
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
}

const DRAFTING_STAGES = [
  'Initializing Stillwater AI Core...',
  'Analyzing Policy Framework...',
  'Synthesizing Compliance Evidence...',
  'Formatting Documentation...',
  'Finalizing...'
];

export function WizardPanel({ policy, initialWizardState, userId }: Props) {
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
    <div className="glass-card p-5">
      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
        <PlayCircle size={14} style={{ color: 'var(--color-primary)' }} />
        Implementation Wizard
      </h2>

      {!started ? (
        <div>
          <p className="text-xs mb-4" style={{ color: 'var(--secondary)' }}>
            Step-by-step guidance for implementing {policy.name}. {steps.length} steps total.
          </p>
          <button onClick={handleStart} disabled={isPending} className="btn-primary w-full justify-center text-sm">
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
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`wizard-step-node text-[11px] ${isDone ? 'wizard-step-completed' : isActive ? 'wizard-step-active' : 'wizard-step-locked'}`}
                    style={{ width: 26, height: 26, fontSize: 11 }}
                  >
                    {isDone ? <CheckCircle2 size={12} /> : isLocked ? <Lock size={10} /> : i + 1}
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
                  className="btn-primary w-full justify-center text-sm py-3 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  Draft Evidence with Stillwater AI
                </button>
              </div>
            )}

            {!isDrafting && !isPendingPanel && (
              <div className="flex flex-col gap-2">
                {/* Auto-Repair Shortcut */}
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
                    className="btn-ghost !bg-emerald-500/20 hover:!bg-emerald-500/40 !border-emerald-500/50 flex items-center justify-center gap-2 text-[11px] font-black text-emerald-400 py-3 border-2 animate-pulse-slow mb-1"
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
         <div className="flex items-center justify-between text-[9px] font-mono text-white/20 uppercase tracking-tighter">
            <span>Authenticated_As</span>
            <span className="text-blue-400 font-bold">local-user</span>
         </div>
         <div className="flex items-center justify-between text-[9px] font-mono text-white/20 uppercase tracking-tighter">
            <span>System_Ref_ID</span>
            <span className="text-white/40">{policy.id}</span>
         </div>
         <div className="p-2 rounded bg-black/40 border border-white/5 text-[8px] font-mono text-emerald-500/60 break-all">
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
