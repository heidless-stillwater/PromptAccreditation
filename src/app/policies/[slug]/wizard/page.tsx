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

export default async function PolicyWizardPage({ params }: Props) {
  const { slug } = await params;
  const user = await AuthService.getCurrentUser();
  const policy = await PolicyService.getPolicyBySlug(slug);
  
  if (!policy || !user) notFound();
  
  console.log(`[WizardPage] Auditing Mission: User=${user.uid}, PolicyID=${policy.id}`);

  const wizardState = await PolicyService.getWizardState(policy.id, user.uid);
  const completedIds = wizardState?.stepsCompleted || [];
  
  const rawSteps = policy.implementationGuide || [];
  
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
    // FORCE-ALIGNMENT: Ensure Step 2 always has its technical probe bound
    if (step.id === 'dpa-step-2' || step.id?.includes('step-2')) {
      step.automatedProbeId = 'probe-encryption-enforcement';
      step.automatable = true;
    }

    const isCompleted = completedIds.includes(step.id);
    const prevStep = idx > 0 ? rawSteps[idx - 1] : null;
    const isPrevCompleted = !prevStep || completedIds.includes(prevStep.id);

    let status = isCompleted ? 'completed' : (isPrevCompleted ? 'pending' : 'locked');
    
    // EMERGENCY OVERRIDE: Unlock Step 2 for immediate technical remediation
    if ((step.id === 'dpa-step-2' || step.id?.includes('step-2')) && status !== 'completed') {
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
    <main className="min-h-screen bg-[#050505] text-white">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* 1. PROTOCOL: SOVEREIGN HEADER */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Link href={`/policies/${policy.slug}`} className="flex items-center gap-2 text-sm mb-8 hover:underline text-white/40">
        <ChevronLeft size={14} />
        Back to Policy
      </Link>

      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{policy.name} Implementation Wizard</h1>
            <p className="text-sm text-white/40">Sovereign Compliance Pipeline v4.0</p>
          </div>
        </div>
        
        <WizardResetClient policyId={policy.id} policyName={policy.name} />
      </header>

      <WizardAccordionClient 
        policyId={policy.id}
        policySlug={policy.slug}
        userUid={user.uid}
        initialSteps={steps}
      />
    </main>
  );
}
