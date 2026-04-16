import Link from 'next/link';
import {
  Shield, Lock, AlertTriangle, CheckCircle2,
  Terminal, Activity, ArrowRight, Globe
} from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { AuthService } from '@/lib/services/auth-service';
import { AuditService } from '@/lib/services/audit-service';
import { ScanButton } from '@/components/shared/scan-button';
import { SUITE_APPS } from '@/lib/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Centre',
  description: 'Active Policy Controller — suite-wide governance dashboard',
};

export default async function CommandCentre() {
  const user = await AuthService.getCurrentUser();
  const policies = await PolicyService.getAllPolicies();
  const openTickets = await PolicyService.getOpenTickets();
  const recentLogs = await AuditService.getRecentLogs(10);

  const totalChecks = policies.reduce((a, p) => a + (p.checks?.length ?? 0), 0);
  const passedChecks = policies.reduce(
    (a, p) => a + (p.checks?.filter((c) => c.status === 'green').length ?? 0),
    0
  );
  const criticalCount = openTickets.filter((t) => t.priority === 'critical').length;
  const complianceScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  const scoreColor =
    complianceScore >= 80 ? 'var(--status-green)' :
    complianceScore >= 50 ? 'var(--status-amber)' :
    'var(--status-red)';

  const tierColor = 
    user?.tier === 'enterprise' ? '#c084fc' : // Purple
    user?.tier === 'professional' ? '#60a5fa' : // Blue
    '#94a3b8'; // Slate

  return (
    <main className="p-8 max-w-7xl mx-auto min-h-screen animate-fade-in">

      {/* ── Header ── */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe size={22} style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-3xl font-bold tracking-tight">
              <span style={{ color: 'var(--foreground)' }}>Prompt</span>
              <span className="text-gradient-primary">Accreditation</span>
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            App Suite Governance &amp; Active Policy Controller
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          {user && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white leading-tight">{user.displayName || user.email}</span>
                <span 
                  className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border"
                  style={{ borderColor: `${tierColor}44`, color: tierColor, background: `${tierColor}11` }}
                >
                  {user.tier}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-cover border border-white/10" style={{ backgroundImage: `url(${user.photoURL || 'https://www.gravatar.com/avatar?d=mp'})` }} />
            </div>
          )}
          <div className="flex items-center gap-4">
            <ScanButton />
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Activity size={12} className="animate-pulse" style={{ color: 'var(--status-green)' }} />
              <span style={{ color: '#34d399' }}>CONTROLLER ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero KPI Row ── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-6 flex flex-col items-center justify-center md:col-span-1 border-t-2" style={{ borderTopColor: scoreColor }}>
          <div className="text-2xl font-bold mb-1" style={{ color: scoreColor }}>{complianceScore}%</div>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Compliance</p>
        </div>
        <div className="glass-card p-6 border-l-2 border-l-amber-500/50">
          <p className="text-2xl font-bold mb-1">{openTickets.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Open Tickets</p>
        </div>
        <div className="glass-card p-6 border-l-2" style={{ borderLeftColor: criticalCount > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>
          <p className="text-2xl font-bold mb-1">{criticalCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Critical Issues</p>
        </div>
        <div className="glass-card p-6 border-l-2 border-l-blue-500/50">
          <p className="text-2xl font-bold mb-1">{SUITE_APPS.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Apps Monitored</p>
        </div>
      </section>

      {/* ── Main Dashboard Content ── */}
      <div className="flex flex-col gap-10">
        
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield size={18} className="text-blue-400" />
              Governance Policies
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {policies.map((policy) => {
              const policyChecks = policy.checks ?? [];
              
              // 1. Automated Probes (Technical Status)
              const probes = policyChecks.filter(c => c.category === 'automated' || c.category === 'hybrid' || !!c.probeId);
              const probesPassed = probes.filter(c => c.status === 'green').length;
              const probesTotal = probes.length;
              const techPercent = probesTotal > 0 ? Math.round((probesPassed / probesTotal) * 100) : 0;
              const techStatus = probesTotal > 0 && probesPassed === probesTotal ? 'green' : policy.status;

              // 2. Manual Accreditation (Governance Progress)
              const manual = policyChecks.filter(c => c.category === 'manual');
              const manualDone = manual.filter(c => c.status === 'green').length;
              const manualTotal = manual.length;
              const manualPercent = manualTotal > 0 ? Math.round((manualDone / manualTotal) * 100) : 0;

              return (
                <Link key={policy.id} href={`/policies/${policy.slug}`} className="glass-card p-5 group hover:border-blue-500/40 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`badge-${techStatus} text-[10px]`}>{techStatus.toUpperCase()}</span>
                      {manualPercent > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-white/5 bg-white/5 text-white/60">
                          {manualDone}/{manualTotal} DOCS
                        </span>
                      )}
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  
                  <h3 className="text-sm font-bold mb-3">{policy.name}</h3>
                  
                  <div className="space-y-3">
                    {/* Automation Track */}
                    <div>
                      <div className="flex justify-between items-center text-[9px] text-white/40 mb-1 uppercase tracking-wider font-mono">
                        <span>Automation Status</span>
                        <span>{techPercent}% Compliant</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className={`h-full progress-fill-${techStatus}`} style={{ width: `${techPercent}%` }} />
                      </div>
                    </div>

                    {/* Governance Track */}
                    <div>
                      <div className="flex justify-between items-center text-[9px] text-white/40 mb-1 uppercase tracking-wider font-mono">
                        <span>Manual Accreditation</span>
                        <span>{manualPercent}% Ready</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/50" style={{ width: `${manualPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="console-panel">
            <div className="console-header">
              <Terminal size={12} className="text-white/40" />
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live Audit Stream</span>
            </div>
            <div className="p-4 space-y-2 text-[11px] font-mono max-h-64 overflow-y-auto custom-scrollbar">
              {recentLogs.map((log) => (
                <p key={log.id}>
                  <span className={`console-log-${log.action.includes('fail') || log.action.includes('error') ? 'err' : 'ok'}`}>
                    [{log.action.toUpperCase()}]
                  </span>{" "}
                  <span className="text-white/50">{log.targetType}: {log.targetId} — {new Date(log.timestamp || Date.now()).toLocaleTimeString()}</span>
                </p>
              ))}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
