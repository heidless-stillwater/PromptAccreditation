'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Shield, 
  ListChecks, 
  Activity, 
  Sparkles,
  ChevronDown,
  ArrowUpRight,
  Type,
  Mail,
  Globe,
  Settings2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ArrowRightCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InteractiveChecklist } from '@/components/policies/interactive-checklist';
import { 
  draftEvidenceAction, 
  triggerActiveFix,
  triggerDriftAuditAction,
  completeManualStepAction
} from '@/lib/actions';
import { getSatelliteAppName } from '@/lib/utils/url-utils';

interface Step {
  id: string;
  title: string;
  description: string;
  type: string;
  isCompleted: boolean;
  intensity?: string;
  relatedCheckId?: string;
  automatable?: boolean;
}

interface Props {
  policyId: string;
  policySlug: string;
  step: Step;
  draftResult?: { content: string; checklist: string };
  checklistProgress?: boolean[];
  isDrifted?: boolean;
}

const DRAFTING_STAGES = [
  'Establishing Secure Handshake...',
  'Ingesting Policy Context...',
  'Synthesizing Technical Blueprint...',
  'Verifying Accreditation Bounds...',
  'Finalizing Bimodal Roadmap...'
];

export function WizardStepClient({ policyId, policySlug, step, draftResult, checklistProgress = [], isDrifted }: Props) {
  const [anchoredFrom, setAnchoredFrom] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sovereign_return_path');
    if (stored) setAnchoredFrom(stored);
  }, []);

  const appName = getSatelliteAppName(anchoredFrom);
  const [isPending, startTransition] = useTransition();
  const [isRepairing, setIsRepairing] = useState(false);
  const [isPendingDraft, setIsPendingDraft] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditModal, setAuditModal] = useState<{ open: boolean; success: boolean; message: string | null }>({ open: false, success: false, message: null });
  const [repairError, setRepairError] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);
  const [draftingStage, setDraftingStage] = useState(0);
  const [viewMode, setViewMode] = useState<'evidence' | 'todo' | 'survey'>('todo');
  const [evidenceUrlInput, setEvidenceUrlInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [surveyData, setSurveyData] = useState({
    companyName: '',
    dpoEmail: '',
    jurisdiction: 'United Kingdom (UK GDPR)'
  });

  const stepId = step.id;
  
  const LOCK_KEY = `synthesis_lock_${policyId}_${stepId}`;
  const DATA_KEY = `synthesis_data_${policyId}_${stepId}`;

  const [initialEvidence, setInitialEvidence] = useState(draftResult?.content || '');
  const [initialChecklist, setInitialChecklist] = useState(draftResult?.checklist || '');
  const [hasResult, setHasResult] = useState(!!(initialEvidence && initialEvidence.trim().length > 0));
  const [initialChecklistProgress, setInitialChecklistProgress] = useState<boolean[]>(checklistProgress);

  const isExecutingRef = useRef(false);

  useEffect(() => {
    localStorage.removeItem(DATA_KEY);
  }, [stepId, hasResult]);

  useEffect(() => {
    if (stepId === 'dpa-step-3' && !step.isCompleted && !hasResult) {
      setViewMode('survey');
    }
  }, [stepId, step.isCompleted, hasResult]);

  useEffect(() => {
    if (isPendingDraft) {
      const interval = setInterval(() => {
        setDraftingStage(prev => (prev + 1) % DRAFTING_STAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isPendingDraft]);

  const handleDriftAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await triggerDriftAuditAction(policySlug);
      setAuditModal({
        open: true,
        success: res.success && !res.message?.includes('Drift Detected'),
        message: res.message
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const closeAuditModal = () => {
    setAuditModal({ open: false, success: false, message: null });
    window.location.reload();
  };

  const handleDraft = async (context?: any) => {
    if (isExecutingRef.current) return;
    localStorage.setItem(LOCK_KEY, Date.now().toString());
    isExecutingRef.current = true;
    setIsPendingDraft(true);
    setDraftingStage(0);
    try {
      const res = await draftEvidenceAction(policyId, stepId, context) as any;
      if (res.success && res.content) {
        setInitialEvidence(res.content);
        setInitialChecklist(res.checklist || '');
        setHasResult(true);
        setViewMode('todo');
        setIsEditing(false);
      } else {
        setInitialEvidence(`Synthesis Suspended: ${res.message}.`);
        setHasResult(true);
      }
    } catch (error: any) {
      setInitialEvidence(`System Error: ${error.message}`);
      setHasResult(true);
    } finally {
      setIsPendingDraft(false);
      isExecutingRef.current = false;
    }
  };

  const handleStep3Signoff = () => {
    setCertError(null);
    startTransition(async () => {
      try {
        const res = await completeManualStepAction(policySlug, stepId, evidenceUrlInput);
        if (res.success) {
          window.location.reload();
        } else {
          setCertError(res.message || 'Certification engine rejected the request.');
        }
      } catch (err: any) {
        setCertError(err.message);
      }
    });
  };

  const handleActiveRepair = async () => {
    setIsRepairing(true);
    setRepairError(null);
    try {
      const res = await triggerActiveFix(stepId) as any;
      if (res.success) {
         window.location.reload();
      } else {
         setRepairError(res.message);
      }
    } catch (err: any) {
      setRepairError(err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px black inset !important;
            -webkit-text-fill-color: white !important;
        }
      `}</style>
      
      {auditModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={closeAuditModal} />
           <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center gap-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
                auditModal.success ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'bg-amber-500/10 text-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
              }`}>
                {auditModal.success ? <ShieldCheck size={48} /> : <AlertCircle size={48} />}
              </div>
              <div className="flex flex-col gap-3 text-center">
                 <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.08em]">
                   {auditModal.success ? 'Integrity Verified' : 'Technical Drift Detected'}
                 </h3>
                 <p className="text-xs text-white/40 leading-relaxed max-w-[280px] mx-auto">
                   {auditModal.message}
                 </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                {auditModal.success && anchoredFrom && (
                   // eslint-disable-next-line @next/next/no-html-link-for-pages
                  <a 
                    href={anchoredFrom}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
                  >
                    <ArrowRightCircle size={18} className="group-hover:translate-x-1 transition-transform" />
                    RETURN TO {appName.toUpperCase()}
                  </a>
                )}
                <button 
                  onClick={closeAuditModal}
                  className="w-full justify-center text-sm font-bold py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all font-mono uppercase tracking-widest"
                >
                  Acknowledge_Dossier
                </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
         <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">{step.title}</h3>
             <div className="flex items-center gap-3">
               {step.isCompleted && (
                 <button 
                  onClick={handleDriftAudit}
                  disabled={isAuditing}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-[0.08em] hover:bg-white/10 hover:text-white transition-all group font-mono"
                 >
                   {isAuditing ? <RefreshCw className="animate-spin text-indigo-400" size={12} /> : <Shield size={12} className="group-hover:text-emerald-400 transition-colors" />}
                   Verify_Integrity
                 </button>
               )}
               <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.08em] font-mono ${
                  step.isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
               }`}>
                  {step.isCompleted ? 'Mission_Complete' : 'Active_Mission'}
               </div>
            </div>
         </div>
      </div>

      {isDrifted && (
         <div className="p-10 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden group/drift">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10">
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/10 animate-pulse">
                     <Activity size={28} className="text-red-400" />
                  </div>
                  <div>
                     <div className="badge-red mb-1.5 w-fit">
                        Resolution_Path_Required
                     </div>
                     <h4 className="text-xl font-bold text-gradient-danger uppercase tracking-tight leading-none">Emergency Restoration</h4>
                  </div>
               </div>

               <div className="space-y-4 mb-10">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                     <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">Detected Problem</p>
                     <p className="text-sm text-red-200/80 font-medium">
                        Technical measure <span className="text-white font-bold">"{step.title}"</span> has failed its clinical audit. 
                        The infrastructure is currently out of sync with the accreditation baseline.
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                     onClick={async () => {
                       const { remediatePolicyAction } = await import('@/lib/actions');
                       startTransition(async () => {
                          await remediatePolicyAction(policySlug);
                          window.location.reload();
                       });
                     }}
                     disabled={isPending}
                     className="py-6 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-2xl text-sm uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-lg glow-danger group/btn relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                     {isPending ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                     RESTORE INTEGRITY
                  </button>
                  
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-center">
                     <p className="text-[10px] text-white/40 uppercase tracking-[0.08em] font-bold font-mono mb-1">Impact</p>
                     <p className="text-xs text-white/60">Restoring will release the Sovereign Lock across all satellite nodes.</p>
                  </div>
               </div>
            </div>
         </div>
      )}

      <div className="grid gap-8">
         {step.automatable ? (
            <div className="flex flex-col gap-6">
               <div className="p-8 rounded-[2.5rem] bg-blue-500/[0.03] border border-blue-500/10 flex flex-col gap-4">
                  <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">Infrastructural Control</h4>
                  <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed font-sans">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {step.description}
                     </ReactMarkdown>
                  </div>
               </div>

                {(isEditing || !step.isCompleted) ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleActiveRepair}
                        disabled={isRepairing}
                        className="relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-blue-900/40 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group text-left w-full"
                      >
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform">
                               <Activity size={32} />
                            </div>
                            <div className="flex flex-col gap-1">
                               <h4 className="text-lg font-black text-white uppercase tracking-widest">Trigger Active {step.title} Fix</h4>
                               <p className="text-xs text-white/40">Clinically Verify & Anchor Infrastructural Compliance</p>
                            </div>
                         </div>
                         {isRepairing && (
                           <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center gap-4">
                              <Loader2 className="animate-spin text-indigo-400" size={24} />
                           </div>
                         )}
                      </button>

                      <button 
                         onClick={handleStep3Signoff}
                         disabled={isPending}
                         className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                      >
                         {isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} className="text-emerald-400" />}
                         <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Force Accreditation Sign-off</span>
                      </button>
                    </div>

                    {isEditing && (
                      <button onClick={() => setIsEditing(false)} className="text-[10px] text-white/20 hover:text-white transition-all text-center mt-2 uppercase tracking-widest">Cancel_Revision</button>
                    )}

                    {repairError && (
                      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                           <AlertCircle size={14} className="text-red-400" />
                           <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Remediation Failed</p>
                        </div>
                        <p className="text-xs text-white/60 font-mono">{repairError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                     <div className="p-8 rounded-[2.5rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col items-center gap-4 text-center group relative overflow-hidden">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                           <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-[0.08em]">Enforcement Active</h4>
                        <p className="text-[10px] text-emerald-500/40 uppercase font-bold font-mono tracking-[0.08em]">Verified by Sovereign Audit</p>
                     </div>

                     <div className="p-8 rounded-[2.5rem] bg-indigo-500/[0.02] border border-white/5 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                              <Settings2 size={14} className="text-indigo-400/40" /> Infrastructural Console
                           </h4>
                           <span className="text-[8px] font-black text-indigo-400/40 uppercase tracking-widest px-2 py-0.5 border border-indigo-400/20 rounded-md">Re-verify_Control</span>
                        </div>
                        
                        <button 
                          onClick={handleActiveRepair}
                          disabled={isRepairing}
                          className="relative overflow-hidden p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all group/rerun"
                        >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Activity size={20} />
                                 </div>
                                 <div className="text-left">
                                    <h5 className="text-xs font-black text-white uppercase tracking-widest">Trigger Active {step.title} Fix</h5>
                                    <p className="text-[9px] text-white/20 uppercase tracking-tight">Manual Verification Overwrite</p>
                                 </div>
                              </div>
                              <ArrowUpRight size={16} className="text-white/10 group-hover/rerun:text-indigo-400 group-hover/rerun:translate-x-0.5 group-hover/rerun:-translate-y-0.5 transition-all" />
                           </div>
                           {isRepairing && (
                             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-indigo-400" size={16} />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Enforcing...</span>
                             </div>
                           )}
                        </button>
                     </div>

                     <button onClick={() => setIsEditing(true)} className="text-[10px] text-white/20 hover:text-white transition-all text-center uppercase tracking-widest">Revise_Dossier_Evidence</button>
                  </div>
                )}
            </div>
         ) : (
            <div className="flex flex-col gap-4">
               <div className="p-8 rounded-[2.5rem] bg-blue-500/[0.03] border border-blue-500/10 flex flex-col gap-4">
                  <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">Operational Control</h4>
                  <div className="prose prose-invert prose-sm max-w-none text-white/80 font-sans">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.description}</ReactMarkdown>
                  </div>
               </div>

                {isPendingDraft ? (
                   <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                       <Activity size={14} className="text-blue-400 animate-pulse" />
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{DRAFTING_STAGES[draftingStage]}</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500/50 transition-all duration-1000" style={{ width: `${((draftingStage + 1) / DRAFTING_STAGES.length) * 100}%` }} />
                     </div>
                   </div>
                ) : (isEditing || !step.isCompleted) ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
                      <button onClick={() => setViewMode('todo')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'todo' ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'text-white/40 hover:text-white'}`}>[TASKS]</button>
                      {stepId === 'dpa-step-3' && <button onClick={() => setViewMode('survey')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'survey' ? 'bg-amber-600 text-white shadow-[0_4px_12px_rgba(217,119,6,0.3)]' : 'text-white/40 hover:text-white'}`}>[PERSONALIZE]</button>}
                    </div>

                    {viewMode === 'survey' ? (
                       <div className="p-10 rounded-[2.5rem] bg-indigo-500/[0.03] border border-indigo-500/10 flex flex-col gap-8 animate-in zoom-in-95 duration-500">
                          <div className="flex items-center justify-between">
                             <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.08em] font-mono">Discovery Survey</h4>
                             {isEditing && <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold text-white/20 uppercase tracking-[0.08em] hover:text-white transition-colors font-mono">Cancel_Revision</button>}
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                             <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-[0.08em] font-mono">Legal Entity Name</label>
                                <input type="text" value={surveyData.companyName} onChange={(e) => setSurveyData({...surveyData, companyName: e.target.value})} className="bg-black border border-white/20 rounded-2xl px-5 py-4 text-sm text-white focus:border-white transition-all font-bold" />
                             </div>
                             <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-white/60 uppercase tracking-[0.08em] font-mono">DPO Contact Email</label>
                                <input type="email" value={surveyData.dpoEmail} onChange={(e) => setSurveyData({...surveyData, dpoEmail: e.target.value})} className="bg-black border border-white/20 rounded-2xl px-5 py-4 text-sm text-white focus:border-white transition-all font-bold" />
                             </div>
                          </div>
                          <button onClick={() => handleDraft(surveyData)} disabled={!surveyData.companyName || !surveyData.dpoEmail} className="btn-primary w-full justify-center py-5 text-sm font-semibold uppercase tracking-[0.15em]">
                             Synthesize Personalized Policy
                          </button>
                       </div>
                    ) : (
                      <div className="flex flex-col gap-4 animate-in slide-in-from-left-4 duration-500">
                         {hasResult ? (
                          <div className="flex flex-col gap-6">
                            <InteractiveChecklist policyId={policyId} stepId={step.id} checklistRaw={initialChecklist} initialProgress={initialChecklistProgress} />
                            
                            <div className="p-8 rounded-[2.5rem] bg-indigo-500/[0.03] border border-indigo-500/10 flex flex-col gap-6 relative group">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.08em] font-mono">Sovereign Sign-off</h4>
                                  <Shield size={14} className="text-indigo-400/40" />
                                </div>
                                {certError && (
                                   <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                      <AlertCircle size={14} className="text-red-400" />
                                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-[0.08em] font-mono">{certError}</p>
                                   </div>
                                )}
                                
                                {stepId === 'dpa-step-3' ? (
                                  <div className="relative">
                                     <input 
                                       type="url" 
                                       placeholder="https://your-app.com/privacy" 
                                       value={evidenceUrlInput} 
                                       onChange={(e) => setEvidenceUrlInput(e.target.value)} 
                                       className="w-full bg-black border border-white/20 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 transition-all font-bold" 
                                     />
                                     <button 
                                       onClick={(e) => {
                                          e.preventDefault();
                                          setEvidenceUrlInput(window.location.origin + '/privacy');
                                       }}
                                       className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.08em] hover:bg-indigo-500/20 transition-all font-mono"
                                     >
                                         Suggest_URL
                                     </button>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-white/40 leading-relaxed font-sans">
                                    I certify that the internal evidence for **{step.title}** has been technically verified and is ready for formal accreditation.
                                  </p>
                                )}

                                <button onClick={handleStep3Signoff} disabled={isPending || (stepId === 'dpa-step-3' && !evidenceUrlInput)} className="btn-primary w-full justify-center py-5 text-sm font-semibold uppercase tracking-[0.2em]">
                                   {isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                    Formal Accreditation Sign-off
                                </button>
                             </div>
                          </div>
                         ) : (
                            <button onClick={() => handleDraft()} className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl uppercase tracking-widest">Draft Evidence & Blueprint</button>
                         )}
                         {isEditing && <button onClick={() => setIsEditing(false)} className="text-[10px] text-white/20 hover:text-white transition-all text-center mt-2 uppercase tracking-widest">Cancel_Revision</button>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 rounded-[2.5rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col items-center gap-4 text-center group relative overflow-hidden">
                     <CheckCircle2 size={32} className="text-emerald-400" />
                     <h4 className="text-sm font-bold text-white uppercase tracking-[0.08em]">Mission_Complete</h4>
                     <p className="text-[10px] text-emerald-500/40 uppercase font-bold font-mono tracking-[0.08em]">Dossier Locked & Verified</p>
                     <button onClick={() => setIsEditing(true)} className="absolute inset-0 bg-emerald-900/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="btn-primary py-3 px-6 text-sm font-semibold">
                           <Sparkles size={14} /> Revise_Implementation
                        </div>
                     </button>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
}
