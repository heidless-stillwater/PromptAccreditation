import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Shield } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { AuthService } from '@/lib/services/auth-service';
import { WizardResetClient } from '@/components/wizard/WizardResetClient';
import { WizardAccordionClient } from '@/components/wizard/WizardAccordionClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = await PolicyService.getPolicyBySlug(slug);
  return { title: `${policy?.name} Wizard` };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { RestorationButtonClient } from '@/components/policies/RestorationButtonClient';

export default async function PolicyWizardPage({ params }: Props) {
  const { slug } = await params;
  const user = await AuthService.getCurrentUser();
  const policy = await PolicyService.getPolicyBySlug(slug);
  
  if (!policy || !user) notFound();
  
  console.log(`[WizardPage] Auditing Mission: User=${user.uid}, PolicyID=${policy.id}`);

  const wizardState = await PolicyService.getWizardState(policy.id, user.uid);
  const completedIds = wizardState?.stepsCompleted || [];

  const rawSteps = policy.implementationGuide || [];

  // SOVEREIGN STEERING: Identify the exact point of drift
  const breachedCheck = policy.checks.find(c => c.status === 'red');
  
  // High-Fidelity Mapping: Some steps need explicit anchoring if constants aren't enough
  let primaryDriftId = breachedCheck 
     ? rawSteps.find(s => s.relatedCheckId === breachedCheck.id || s.automatedProbeId === breachedCheck.id)?.id 
     : null;

  // SOVEREIGN_HEALER: Fallback mapping for DPA and Security
  if (breachedCheck?.id === 'probe-data-audit') primaryDriftId = 'dpa-step-1';
  if (breachedCheck?.id === 'probe-encryption-enforcement') primaryDriftId = 'dpa-step-2';
  if (breachedCheck?.id === 'probe-security-headers') primaryDriftId = 'sec-step-2';

  const remediationActive = policy.status === 'red';

  console.log(`[WizardPage] STEERING_CONTROL: Active=${remediationActive}, DriftID=${primaryDriftId}, Breached=${breachedCheck?.id}`);

  // FALLBACK: If policy is red but no check is explicitly red, steer to first technical step
  if (!primaryDriftId && remediationActive) {
    primaryDriftId = rawSteps.find(s => s.automatable || s.automatedProbeId)?.id || null;
  }
  
  if (rawSteps.length === 0) {
     return (
       <main className="p-8 max-w-5xl mx-auto">
         <div className="glass-card p-10 text-center">
            <h1 className="text-xl font-bold mb-2">Roadmap Under Construction</h1>
            <p className="text-sm text-white/40">The implementation guide for {policy.name} is being synthesized.</p>
         </div>
       </main>
     );
  }

  const steps = rawSteps.map((step, idx) => {
    // FORCE-ALIGNMENT: Ensure clinical anchoring of technical probes
    if (step.id === 'dpa-step-1') {
      step.relatedCheckId = 'probe-data-audit';
    }
    if (step.id === 'dpa-step-2' || (slug === 'site-security' && step.id === 'sec-step-2') || step.id === 'osa-step-4') {
      step.automatedProbeId = step.id === 'dpa-step-2' ? 'probe-encryption-enforcement' : 
                             step.id === 'osa-step-4' ? 'probe-content-moderation' : 'probe-security-headers';
      step.automatable = true;
    }

    const isCompleted = completedIds.includes(step.id);
    const prevStep = idx > 0 ? rawSteps[idx - 1] : null;
    const isPrevCompleted = !prevStep || completedIds.includes(prevStep.id);

    let status = isCompleted ? 'completed' : (isPrevCompleted ? 'pending' : 'locked');
    
    // EMERGENCY OVERRIDE: Unlock technical steps for immediate remediation
    if (step.automatable && status !== 'completed') {
      status = 'pending';
    }

    return {
      ...step,
      status,
      automatable: step.automatable,
      evidenceUrl: wizardState?.evidenceUploaded?.[step.id],
      checklistUrl: wizardState?.checklistsUploaded?.[step.id],
      checklistProgress: wizardState?.checklistProgress?.[step.id] || []
    };
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 max-w-5xl mx-auto">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. PROTOCOL: SOVEREIGN HEADER */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Link href={`/policies/${policy.slug}`} className="flex items-center gap-2 text-sm mb-8 hover:underline text-white/40">
        <ChevronLeft size={14} />
        Back to Policy Overview
      </Link>

      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/5">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight">Implementation Wizard</h1>
            <div className="flex items-center gap-3">
               <p className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-[0.08em]">{policy.name}</p>
               <div className="w-1 h-1 rounded-full bg-white/10" />
               <p className="text-[10px] text-blue-400/60 font-mono font-bold uppercase tracking-[0.08em]">v4.2 // Sentinel_Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {remediationActive && <RestorationButtonClient policySlug={policy.slug} />}
           <WizardResetClient policyId={policy.id} policyName={policy.name} />
        </div>
      </header>

      {/* EMERGENCY STEERING BANNER */}
      {remediationActive && (
        <div className="mb-10 p-6 glass-card border-red-500/20 glow-danger flex items-center justify-between animate-pulse-slow relative overflow-hidden">
           <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shadow-lg shadow-red-500/10">
                <Shield size={22} className="text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gradient-danger uppercase tracking-tight leading-none mb-1">Sovereign Steering Mode</p>
                <div className="flex items-center gap-3">
                   <p className="text-[10px] text-red-200/50 font-mono font-bold uppercase tracking-[0.08em]">Status: Restricted_Access</p>
                   <div className="w-1 h-1 rounded-full bg-red-500/30" />
                   <p className="text-[10px] text-red-200/30 font-mono font-bold uppercase tracking-[0.08em]">Drift_ID: Detected</p>
                </div>
              </div>
           </div>
           <div className="text-[11px] text-red-400 font-bold uppercase tracking-[0.15em] relative z-10">
             Fix Integrity to Release System Lock
           </div>
        </div>
      )}

      <WizardAccordionClient 
        policyId={policy.id}
        policySlug={policy.slug}
        userUid={user.uid}
        initialSteps={steps}
        remediationActive={remediationActive}
        primaryDriftId={primaryDriftId}
      />
    </main>
  );
}
