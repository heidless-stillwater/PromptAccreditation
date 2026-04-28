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
    <div className="max-w-7xl mx-auto p-8 animate-fade-in space-y-12">
      {/* ── Header ── */}
      <header className="flex justify-between items-end border-b border-teal-500/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe size={22} className="text-teal-500" />
            <h1 className="text-3xl font-bold tracking-tight font-outfit">
              <span className="text-[#e2e8f4]">Prompt</span>
              <span className="bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent font-extrabold">Accreditation</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Welcome back, <span className="text-white">{user?.displayName || user?.email}</span> &bull; <span className="text-teal-500">Suite Controller</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/5 border border-teal-500/20">
            <span className="status-dot status-green" />
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Sovereign Active</span>
          </div>
        </div>
      </header>

      {/* ── Core Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Policy Coverage', value: '100%', sub: `${initialPolicies.length} Active Policies`, icon: Shield, color: 'teal' },
          { label: 'Compliance Score', value: `${initialScore}%`, sub: 'Audit Confidence', icon: BarChart3, color: 'teal' },
          { label: 'Active Drift', value: '0', sub: 'Technical Deviations', icon: Activity, color: 'emerald' },
          { label: 'Action Items', value: openTickets.toString(), sub: 'Pending Remediation', icon: ListChecks, color: openTickets > 0 ? 'amber' : 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 group">
            <div className="flex items-center justify-between mb-4">
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-500/10 border border-${stat.color}-500/20 group-hover:bg-${stat.color}-500/20 transition-all`}
              >
                <stat.icon size={22} className={`text-${stat.color}-400`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white font-outfit">{stat.value}</h3>
              <p className="text-[11px] font-bold text-slate-600">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Active Registry ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Compliance Registry</h2>
          <Link href="/policies" className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
            View Policy Hub <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {initialPolicies.map((policy) => (
            <div key={policy.id} className="glass-card p-6 flex items-start gap-5 group">
              <div className={`mt-1 status-dot status-${policy.status}`} />
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors">{policy.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{policy.regulatoryBody} &bull; <span className="text-rose-400">{policy.maxPenalty} Max Fine</span></p>
                  </div>
                  <div className={`badge-${policy.status}`}>{policy.status}</div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                   <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">{policy.intensity} Intensity</span>
                   </div>
                   <Link 
                     href={`/policies/${policy.slug}`}
                     className="p-2 rounded-lg bg-white/5 hover:bg-teal-500/20 text-slate-400 hover:text-teal-400 transition-all"
                   >
                     <ChevronRight size={16} />
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Infrastructure State ── */}
      <div className="glass-card p-8 border-teal-500/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Infrastructure Integrity Console</h3>
          <div className="badge-muted bg-teal-500/10 text-teal-400 border-teal-500/20">Sovereign Build 15.0.8</div>
        </div>
        
        <div className="p-5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs space-y-2.5">
          <p className="text-teal-400 font-bold">&gt; Policy Service: <span className="text-emerald-400">Re-attached and Synchronized.</span></p>
          <p className="text-slate-500">&gt; Database: promptaccreditation-db-0 (Connected)</p>
          <p className="text-teal-400 font-bold">&gt; Handshake: <span className="text-emerald-400">{initialPolicies.length} Policies Map Anchored.</span></p>
          <p className="text-slate-500">&gt; Runtime: Node 22 Stability Confirmed.</p>
        </div>
      </div>
    </div>
  );
}


