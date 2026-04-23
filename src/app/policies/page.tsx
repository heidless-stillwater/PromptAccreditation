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
    <main className="p-8 max-w-6xl mx-auto animate-fade-in">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2 text-left">
          <Shield size={22} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-3xl font-bold">Policy Hub</h1>
        </div>
        <p className="text-sm text-left" style={{ color: 'var(--secondary)' }}>
          Guided implementation wizards and enforcement controls for each governance policy.
        </p>
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
              className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center gap-6 group relative overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.04]"
            >
              {/* Card-wide Link Overlay */}
              <Link 
                href={`/policies/${policy.slug}`}
                className="absolute inset-0 z-0"
                aria-label={`View ${policy.name} details`}
              />

              {/* Left Side: Icon & Info */}
              <div className="flex-1 flex items-center gap-6 min-w-0 relative z-10 pointer-events-none">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
                >
                  <CategoryIcon size={22} style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                      {policy.name}
                    </h3>
                    <span className={`badge-${policy.status}`}>{policy.status.toUpperCase()}</span>
                  </div>
                  <p className="text-xs mb-3 text-left" style={{ color: 'var(--secondary)' }}>
                    {policy.regulatoryBody} · Penalty: {policy.maxPenalty}
                  </p>

                  <div className="max-w-md">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span style={{ color: 'var(--muted)' }}>Implementation progress</span>
                      <span style={{ color: 'var(--secondary)' }}>{passed}/{total} checks</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill-${policy.status} h-full rounded-full`}
                        style={{ width: `${pct}%`, transition: 'width 0.7s ease' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                  <span
                    className="text-xs font-mono px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--secondary)', border: '1px solid var(--color-border)' }}
                  >
                    {policy.intensity.toUpperCase()}
                  </span>

                  {openChecks > 0 && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--status-amber)' }}>
                      <AlertTriangle size={12} />
                      <span>{openChecks} open checks</span>
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
                    className="flex items-center gap-2 text-xs font-semibold hover:text-blue-400 transition-colors"
                    style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                  >
                    <span>Open Wizard</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Hover Detail (Subtle Overlay) */}
              <div className="absolute bottom-2 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:flex relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(16, 185, 129, 0.6)' }}>{passed} verified</span>
                  </div>
                </div>
                <span className="text-[8px] font-mono" style={{ color: 'rgba(255, 255, 255, 0.1)' }}>ID: {policy.id.substring(0, 8)}...</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
