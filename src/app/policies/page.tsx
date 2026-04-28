import Link from 'next/link';
import { Shield, Lock, Eye, ChevronRight, AlertTriangle } from 'lucide-react';
export const dynamic = 'force-dynamic';
import { PolicyService } from '@/lib/services/policy-service';
import { SyncRegistryButton } from '@/components/policies/sync-registry-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policy Hub',
  description: 'Manage and monitor all active governance policies',
};

const CATEGORY_CONFIG = {
  safety:   { label: 'Online Safety',    icon: Eye,           color: '#ef4444' },
  data:     { label: 'Data Protection',  icon: Lock,          color: '#f59e0b' },
  security: { label: 'Site Security',    icon: Shield,        color: '#10b981' },
};

export default async function PoliciesPage() {
  const policies = await PolicyService.getAllPolicies();

  return (
    <main className="max-w-7xl mx-auto p-8 animate-fade-in space-y-12">
      <header className="flex justify-between items-end border-b border-teal-500/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={22} className="text-teal-500" />
            <h1 className="text-3xl font-bold font-outfit">Policy Hub</h1>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Guided implementation wizards and enforcement controls for the Prompt App Suite.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {policies.map((policy) => {
          const cfg = (CATEGORY_CONFIG as any)[policy.category] || { label: 'Governance', icon: Shield, color: '#94a3b8' };
          const CategoryIcon = cfg.icon;
          const total = policy.checks?.length ?? 0;
          const passed = policy.checks?.filter((c) => c.status === 'green').length ?? 0;
          const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
          const openChecks = policy.checks?.filter((c) => c.status !== 'green').length ?? 0;

          return (
            <div
              key={policy.id}
              className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-8 group relative overflow-hidden transition-all duration-300"
            >
              {/* Card-wide Link Overlay */}
              <Link 
                href={`/policies/${policy.slug}`}
                className="absolute inset-0 z-0"
                aria-label={`View ${policy.name} details`}
              />

              {/* Left Side: Icon & Info */}
              <div className="flex-1 flex items-center gap-8 min-w-0 relative z-10 pointer-events-none">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-teal-500/5 border border-teal-500/10 group-hover:bg-teal-500/10 transition-colors"
                >
                  <CategoryIcon size={26} className="text-teal-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-bold text-lg text-white group-hover:text-teal-400 transition-colors">
                      {policy.name}
                    </h3>
                    <div className={`badge-${policy.status}`}>{policy.status.toUpperCase()}</div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mb-4">
                    {policy.regulatoryBody} &bull; <span className="text-rose-400">Penalty: {policy.maxPenalty}</span>
                  </p>

                  <div className="max-w-md">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-500">
                      <span>Implementation Progress</span>
                      <span className="text-teal-500">{passed}/{total} Checks Verified</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]`}
                        style={{ width: `${pct}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions */}
              <div className="flex flex-col items-end gap-4 flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                  <span
                    className="text-[10px] font-black font-mono px-3 py-1 rounded bg-white/5 text-slate-500 border border-white/5 uppercase tracking-widest"
                  >
                    {policy.intensity.toUpperCase()} INTENSITY
                  </span>

                  {openChecks > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                      <AlertTriangle size={12} />
                      <span>{openChecks} Open Checks</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <SyncRegistryButton 
                    policyId={policy.slug || policy.id} 
                    policyName={policy.name} 
                  />
                  
                  <Link 
                    href={`/policies/${policy.slug}`}
                    className="btn-ghost flex items-center gap-2 text-xs font-bold hover:text-teal-400 transition-all px-4 py-2"
                  >
                    <span>Open Wizard</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

