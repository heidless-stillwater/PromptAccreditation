import Link from 'next/link';
import { Shield, Lock, AlertTriangle, CheckCircle2, Terminal, ExternalLink, Activity, Info } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { ScanButton } from '@/components/scan-button';
import { UpgradeCard } from '@/components/upgrade-card';

export default async function PolicyHub() {
  const policies = await PolicyService.getAllPolicies();
  const openTickets = await PolicyService.getOpenTickets();

  const totalChecks = policies.reduce((acc, p) => acc + (p.checks?.length || 0), 0);
  const passedChecks = policies.reduce((acc, p) => 
    acc + (p.checks?.filter(c => c.status === 'green').length || 0), 0
  );
  const complianceRating = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">Prompt</span>
            <span className="text-gradient">Accreditation</span>
          </h1>
          <p className="text-secondary">App Suite Governance & Active Policy Controller</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-4 items-center">
            <ScanButton />
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Activity className="text-success w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Controller Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <Shield className="text-primary w-6 h-6" />
            <span className="text-xs font-mono text-muted uppercase">Ecosystem Scope</span>
          </div>
          <p className="text-2xl font-bold">5 Apps</p>
          <p className="text-sm text-secondary">Active Monitoring Hub</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start mb-4">
            <AlertTriangle className="text-amber-500 w-6 h-6" />
            <span className="text-xs font-mono text-muted uppercase">Resolution Center</span>
          </div>
          <p className="text-2xl font-bold">{openTickets.length} Tickets</p>
          <Link href="/tickets" className="text-sm text-secondary underline decoration-amber-500/30 cursor-pointer hover:text-white transition-colors">Pending Compliance Actions</Link>
        </div>
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <Lock className="text-success w-6 h-6" />
            <span className="text-xs font-mono text-muted uppercase">Compliance Rating</span>
          </div>
          <p className="text-2xl font-bold">{complianceRating}%</p>
          <p className="text-sm text-secondary items-center flex gap-1">Verified Suite Health <CheckCircle2 size={12} /></p>
        </div>
      </section>

      {/* Policy Grid */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Active Governance Policies
          </h2>
          <button className="text-sm text-primary hover:underline flex items-center gap-1 font-medium transition-all">
            Configuration Dashboard <ExternalLink size={14} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((policy) => {
            const totalPolicyChecks = policy.checks?.length || 0;
            const passedPolicyChecks = policy.checks?.filter(c => c.status === 'green').length || 0;
            const progress = totalPolicyChecks > 0 ? Math.round((passedPolicyChecks / totalPolicyChecks) * 100) : 0;

            return (
              <Link href={`/policies/${policy.id}`} key={policy.id} className="glass-card p-6 flex flex-col group cursor-pointer hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`status-dot status-${policy.status}`} />
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-current opacity-70 
                      ${policy.status === 'red' ? 'text-red-400' : policy.status === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>
                      {policy.status}
                    </span>
                    <Info size={14} className="text-muted group-hover:text-primary transition-colors" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{policy.name}</h3>
                <p className="text-sm text-secondary mb-4 line-clamp-2">
                  {policy.intensity === 'hard' ? '🛡️ ' : policy.intensity === 'systemic' ? '⚙️ ' : '📄 '}
                  {policy.definition}
                </p>
                
                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted">Dial: <span className="text-primary-hover uppercase font-mono">{policy.intensity}</span></span>
                    <span className="text-white font-mono">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${policy.status === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : policy.status === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="glass-card p-6 border-dashed border-white/10 flex flex-col items-center justify-center text-muted hover:text-white hover:border-white/30 transition-all group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:text-primary transition-all">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-sm font-medium">Register New Policy</span>
          </div>
        </div>
      </section>

      {/* SaaS Upgrade Section */}
      <section className="mt-12">
        <UpgradeCard />
      </section>

      {/* Controller Log Console */}
      <section className="mt-12">
        <div className="glass-card border-none bg-black/40 overflow-hidden shadow-glow">
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-muted" />
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Active Controller v1.0.0-PRO</span>
            </div>
            <div className="text-[10px] font-mono text-success">STATUS: INTER-APP LINK ESTABLISHED</div>
          </div>
          <div className="p-4 font-mono text-[10px] text-muted space-y-1">
            <p><span className="text-primary">[SYNC]</span> Pulling configuration from promptaccreditation-db-0...</p>
            <p><span className="text-success">[OK]</span> Identified {policies.length} governance policies.</p>
            <p><span className="text-success">[OK]</span> Identified {totalChecks} distinct audit checks across the suite.</p>
            {openTickets.length > 0 ? (
              <p><span className="font-bold text-red-500">[WARN]</span> Found {openTickets.length} unresolved compliance tickets.</p>
            ) : (
              <p><span className="text-success">[OK]</span> All critical tickets resolved.</p>
            )}
            <p className="animate-pulse">_</p>
          </div>
        </div>
      </section>
    </main>
  );
}
