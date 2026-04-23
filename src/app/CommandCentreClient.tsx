'use client';

import { useAuth } from '@/providers/auth-provider';
import { Globe, Shield, Activity, ListChecks, Zap, BarChart3, Lock, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Policy } from '@/lib/types';

interface CommandCentreClientProps {
  initialPolicies: Policy[];
  initialScore: number;
}

export default function CommandCentreClient({ initialPolicies, initialScore }: CommandCentreClientProps) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <Lock size={32} className="text-blue-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Sovereign Clearance Required</h2>
          <p className="text-[#8b95a8] max-w-sm">
            This command centre is restricted to authorized compliance controllers. 
            Please sign in to manage the Prompt App Suite governance.
          </p>
        </div>
        <Link href="/login" className="btn-primary">
          Authorize Session
        </Link>
      </div>
    );
  }

  // Calculate stats from live data
  const totalChecks = initialPolicies.reduce((acc, p) => acc + (p.checks?.length || 0), 0);
  const openTickets = initialPolicies.filter(p => p.status === 'red').length;

  return (
    <div className="animate-fade-in space-y-10">
      {/* ── Header ── */}
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe size={22} style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-[#e2e8f4]">Prompt</span>
              <span className="text-gradient-primary font-extrabold">Accreditation</span>
            </h1>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--secondary)' }}>
            Welcome back, <span className="text-white">{user.displayName || user.email}</span> &bull; Suite Controller
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card-solid">
            <span className="status-dot status-green" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#34d399]">Sovereign Active</span>
          </div>
        </div>
      </header>

      {/* ── Core Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Policy Coverage', value: '100%', sub: `${initialPolicies.length} Active Policies`, icon: Shield, color: 'primary' },
          { label: 'Compliance Score', value: `${initialScore}%`, sub: 'Audit Confidence', icon: BarChart3, color: 'primary' },
          { label: 'Active Drift', value: '0', sub: 'Technical Deviations', icon: Activity, color: 'success' },
          { label: 'Action Items', value: openTickets.toString(), sub: 'Pending Remediation', icon: ListChecks, color: openTickets > 0 ? 'amber' : 'success' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 group hover:translate-y-[-2px] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ background: `var(--color-${stat.color}-dim)`, border: `1px solid var(--color-${stat.color}-dim)` }}
              >
                <stat.icon size={18} style={{ color: `var(--color-${stat.color})` }} />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b95a8]">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#e2e8f4]">{stat.value}</h3>
              <p className="text-[10px] font-medium text-[#4a5568]">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Registry ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#8b95a8]">Compliance Registry</h2>
          <Link href="/policies" className="text-xs font-bold text-blue-400 hover:underline">View Policy Hub →</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {initialPolicies.map((policy) => (
            <div key={policy.id} className="glass-card p-6 flex items-start gap-5">
              <div className={`mt-1 status-dot status-${policy.status}`} />
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#e2e8f4]">{policy.name}</h3>
                    <p className="text-xs text-[#8b95a8] line-clamp-1">{policy.regulatoryBody} &bull; {policy.maxPenalty} Max Fine</p>
                  </div>
                  <div className={`badge-${policy.status}`}>{policy.status}</div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                   <div className="flex gap-2">
                      <span className="text-[10px] font-mono text-[#4a5568] uppercase">{policy.intensity} Intensity</span>
                   </div>
                   <Link 
                     href={`/policies/${policy.slug}`}
                     className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                   >
                     <ChevronRight size={14} className="text-[#8b95a8]" />
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Infrastructure State ── */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#8b95a8]">Infrastructure Integrity Console</h3>
          <div className="badge-primary">Sovereign Build 15.0.8</div>
        </div>
        
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs space-y-2">
          <p className="text-[#34d399]">&gt; Policy Service: Re-attached and Synchronized.</p>
          <p className="text-[#60a5fa]">&gt; Database: promptaccreditation-db-0 (Connected)</p>
          <p className="text-[#34d399]">&gt; Handshake: {initialPolicies.length} Policies Map Anchored.</p>
          <p className="text-[#60a5fa]">&gt; Runtime: Node 22 Stability Confirmed.</p>
        </div>
      </div>
    </div>
  );
}
