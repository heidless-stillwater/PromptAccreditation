import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Shield, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Zap, ExternalLink, ShieldCheck, ArrowRightCircle } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { TicketService } from '@/lib/services/ticket-service';
import { AuthService } from '@/lib/services/auth-service';
import { IntensityDialClient } from '@/components/policies/intensity-dial';
import { CheckRowClient } from '@/components/policies/check-row';
import { WizardPanel } from '@/components/policies/wizard-panel';
import { SuccessBannerReturnButton } from '@/components/policies/SuccessBannerReturnButton';
import { RestorationButtonClient } from '@/components/policies/RestorationButtonClient';
import { DossierExportButton } from '@/components/policies/DossierExportButton';
import { getSatelliteAppName, isStandardSatellite } from '@/lib/utils/url-utils';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = await PolicyService.getPolicyBySlug(slug);
  return { title: policy?.name ?? 'Policy Detail' };
}

export default async function PolicyDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const policy = await PolicyService.getPolicyBySlug(slug);
  if (!policy) notFound();

  const query = await searchParams;
  const headerList = await headers();
  const referer = headerList.get('referer');
  
  const hasDriftedCheck = policy.checks.some(c => c.status !== 'green' && c.status !== 'planned');
  const remediationActive = (policy.status !== 'green' && policy.status !== 'planned') || hasDriftedCheck;
  const remediationSuccess = query.remediate === 'true' && policy.status === 'green';
  
  // HEURISTIC ORIGIN DISCOVERY: Prefer explicit 'from', fallback to valid Satellite referer
  let fromUrl = typeof query.from === 'string' ? query.from : null;
  if (!fromUrl && isStandardSatellite(referer)) {
    fromUrl = referer;
  }
  
  const appName = getSatelliteAppName(fromUrl);

  const tickets = await TicketService.getTicketsByPolicy(policy.id);
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress');

  const user = await AuthService.getCurrentUser();
  const wizardState = user ? await PolicyService.getWizardState(policy.id, user.uid) : null;

  // GLOBAL STEWARDSHIP: Audit all policies to determine the "Next Mission"
  const allPolicies = await PolicyService.getAllPolicies();
  const nextDriftedPolicy = allPolicies.find(p => p.id !== policy.id && (p.status === 'red' || p.status === 'amber' || p.checks.some(c => c.status !== 'green')));
  const allClear = allPolicies.every(p => p.status === 'green' && p.checks.every(c => c.status === 'green'));

  // SOVEREIGN STEERING: Identify the exact point of drift (RED takes priority over AMBER)
  const breachedCheck = policy.checks.find(c => c.status === 'red') || policy.checks.find(c => c.status === 'amber');
  let primaryDriftId = breachedCheck 
     ? policy.implementationGuide.find(s => s.relatedCheckId === breachedCheck.id || s.automatedProbeId === breachedCheck.id)?.id 
     : null;

  // FALLBACK: If policy is drifted but no specific check matches, steer to first technical step
  if (!primaryDriftId && (policy.status === 'red' || policy.status === 'amber')) {
    primaryDriftId = policy.implementationGuide.find(s => s.automatable || s.automatedProbeId)?.id || null;
  }

  const total = policy.checks?.length ?? 0;
  const passed = policy.checks?.filter((c) => c.status === 'green').length ?? 0;

  return (
    <main className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Back */}
      <Link href="/policies" className="flex items-center gap-2 text-sm mb-8 hover:underline" style={{ color: 'var(--secondary)' }}>
        <ChevronLeft size={14} />
        Policy Hub
      </Link>
      
      {/* Success Banner */}
      {remediationSuccess && (
        <div className="mb-8 p-6 glass-card border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between animate-in zoom-in-95 duration-500 relative overflow-hidden group">
           <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                 <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                 <p className="text-xl font-bold uppercase tracking-tight text-gradient-success leading-none mb-1">
                    {allClear ? 'Sovereign Integrity Restored' : 'Policy Restoration Complete'}
                 </p>
                 <p className="text-[10px] text-emerald-400/50 font-mono font-bold uppercase tracking-[0.08em]">
                    {allClear 
                      ? 'All regulatory drifts have been neutralized across the suite.' 
                      : `"${policy.name}" is now nominal. ${nextDriftedPolicy?.name} still requires attention.`}
                 </p>
              </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-3 relative z-10">
              <SuccessBannerReturnButton initialFromUrl={fromUrl} />
              
              {nextDriftedPolicy && !allClear && (
                <Link 
                  href={`/policies/${nextDriftedPolicy.slug}?from=${encodeURIComponent(fromUrl || '')}`}
                  className="px-5 py-3 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 group"
                >
                   Next Mission: {nextDriftedPolicy.name.toUpperCase()}
                   <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <Link 
                href={`/policies/${slug}`}
                className="px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-all font-mono tracking-widest"
              >
                DISMISS
              </Link>
           </div>
        </div>
      )}

       {/* Roadmap Mode Banner */}
       {policy.status === 'planned' && (
         <div className="mb-6 p-6 rounded-3xl bg-violet-500/10 border border-violet-500/20 backdrop-blur-xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-600 to-violet-400" />
            
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Shield size={22} />
               </div>
               <div>
                  <p className="text-base font-black text-white uppercase tracking-tighter italic">Sovereign Roadmap: Future Mission</p>
                  <p className="text-[10px] text-violet-300/60 font-mono uppercase tracking-widest">
                     This policy is currently in the registry as a strategic objective. Direct remediation is not yet active.
                  </p>
               </div>
            </div>

            <div className="px-5 py-2.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
               Phase_Scheduled
            </div>
         </div>
       )}

       {/* Remediation Mode Banner */}
       {remediationActive && !remediationSuccess && (
         <div className="mb-6 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl flex items-center justify-between shadow-[0_0_40px_rgba(239,68,68,0.1)] relative overflow-hidden group">
            {/* Animated accent gradient */}
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-red-600 to-red-400 group-hover:w-2 transition-all" />
            
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse-slow">
                  <Zap size={22} className="text-white" />
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-black text-white uppercase tracking-tighter">Sovereign Steering Active</p>
                    <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[8px] font-black uppercase tracking-widest">Action_Required</span>
                  </div>
                  <p className="text-[10px] text-red-200/60 font-mono uppercase tracking-widest">
                     {primaryDriftId ? `Drift Detected: Physically anchoring to ${primaryDriftId}` : `Systemic Resolution Path: ${slug}`}
                  </p>
               </div>
            </div>

               <div className="flex items-center gap-4 relative z-10">
                  <div className="hidden md:block text-right">
                     <p className="text-[9px] text-white/40 font-mono italic leading-none">Sentinel_Deep_Link_Verified</p>
                     <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">One-Click Registry Sync</p>
                  </div>
                  <RestorationButtonClient policySlug={slug} originUrl={fromUrl} />
               </div>
         </div>
       )}

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge-${policy.status} text-sm`}>{policy.status.toUpperCase()}</span>
              <span className="badge-muted">{policy.regulatoryBody}</span>
              <DossierExportButton policySlug={slug} />
            </div>
            <h1 className="text-2xl font-bold mb-2">{policy.name}</h1>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--secondary)' }}>
              {policy.definition}
            </p>
            {policy.legislativeUrl && (
              <a
                href={policy.legislativeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs mt-3 hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                View Legislation <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Progress circle */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative" style={{ width: 80, height: 80 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.05)" />
                <circle
                  cx="40" cy="40" r="32" fill="none" strokeWidth="7"
                  stroke={
                    policy.status === 'green' ? 'var(--status-green)' : 
                    policy.status === 'amber' ? 'var(--status-amber)' : 
                    policy.status === 'planned' ? 'var(--status-planned)' :
                    'var(--status-red)'
                  }
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - passed / Math.max(total, 1))}`}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">
                  {total > 0 ? Math.round((passed / total) * 100) : 0}%
                </span>
              </div>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest mt-2" style={{ color: 'var(--muted)' }}>
              {passed}/{total} checks
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Intensity Dial */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2">
              <Zap size={14} style={{ color: 'var(--color-primary)' }} />
              Enforcement Intensity
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--secondary)' }}>
              Controls how strictly this policy is enforced across sister apps.
            </p>
            <IntensityDialClient policyId={policy.id} current={policy.intensity} />
          </div>

          {/* Audit Checks */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Shield size={14} style={{ color: 'var(--color-primary)' }} />
              Audit Checks
            </h2>
            <div className="space-y-3">
              {policy.checks?.map((check) => (
                <CheckRowClient
                  key={check.id}
                  check={check}
                  policyId={policy.id}
                />
              ))}
            </div>
          </div>

          {/* Checks & Balances */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: 'var(--status-green)' }} />
              Checks &amp; Balances
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>
              {policy.checksAndBalances}
            </p>
          </div>

          {/* Risks */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <XCircle size={14} style={{ color: 'var(--status-red)' }} />
              Risks &amp; Consequences
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>
              {policy.risksAndConsequences}
            </p>
            <div
              className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
            >
              Max Penalty: {policy.maxPenalty}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Open Tickets */}
          {openTickets.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Clock size={13} style={{ color: 'var(--status-amber)' }} />
                Open Tickets ({openTickets.length})
              </h2>
              <div className="space-y-2">
                {openTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="flex items-start gap-2 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <span
                      className="status-dot mt-0.5 flex-shrink-0"
                      style={{
                        background: t.priority === 'critical' ? 'var(--status-red)' : 'var(--status-amber)',
                        boxShadow: `0 0 8px ${t.priority === 'critical' ? 'var(--status-red)' : 'var(--status-amber)'}`,
                      }}
                    />
                    <span className="text-xs line-clamp-2" style={{ color: 'var(--secondary)' }}>{t.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Implementation Wizard */}
          <WizardPanel 
            policy={policy} 
            initialWizardState={wizardState} 
            userId={user?.uid} 
            remediationActive={remediationActive}
            primaryDriftId={primaryDriftId}
          />
        </div>
      </div>
    </main>
  );
}
