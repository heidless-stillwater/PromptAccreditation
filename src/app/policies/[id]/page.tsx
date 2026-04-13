import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Activity, Info, AlertTriangle, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { IntensityDial } from '@/components/intensity-dial';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export default async function PolicyDetail({ params }: Params) {
  const { id } = await params;
  const policy = await PolicyService.getPolicyById(id);

  if (!policy) {
    return notFound();
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto pb-24">
      {/* Navigation */}
      <div className="mb-8">
        <Link href="/" className="text-secondary hover:text-white flex items-center gap-2 text-sm transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Policy Hub
        </Link>
      </div>

      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-8 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{policy.name}</h1>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-current 
              ${policy.status === 'red' ? 'text-red-400' : policy.status === 'amber' ? 'text-amber-400' : 'text-green-400'}`}>
              {policy.status}
            </span>
          </div>
          <p className="text-secondary leading-relaxed max-w-2xl">{policy.definition}</p>
        </div>

        <div className="w-full md:w-64 shrink-0">
          <IntensityDial policyId={policy.id} initialValue={policy.intensity} />
          {policy.intensity === 'systemic' && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <Lock size={14} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter shadow-glow-red">Systemic Lock Active</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <section className="glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success" /> Checks & Balances
          </h3>
          <p className="text-sm text-secondary leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
            {policy.checksAndBalances}
          </p>
        </section>

        <section className="glass-card p-6 border-l-4 border-l-red-500/30">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400" /> Risks & Consequences
          </h3>
          <p className="text-sm text-secondary leading-relaxed bg-red-500/5 p-4 rounded-lg border-red-500/10">
            {policy.risksAndConsequences}
          </p>
        </section>
      </div>

      {/* Audit Checks Progression */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <ShieldAlert size={18} className="text-primary" />
          <h2 className="text-xl font-semibold">Technical Audit Checks</h2>
        </div>

        <div className="space-y-4">
          {policy.checks.map((check) => (
            <div key={check.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`mt-1 status-dot status-${check.status}`} />
                <div>
                  <h4 className="font-bold text-sm mb-1">{check.title}</h4>
                  <p className="text-xs text-secondary max-w-md">{check.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-mono text-muted uppercase">Last checked: {new Date(check.lastChecked).toLocaleDateString()}</span>
                {check.status !== 'green' && (
                  <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase rounded border border-white/5 transition-all text-amber-400 ">
                    Audit Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Controller Info */}
      <div className="mt-12 flex items-center gap-4 px-6 py-4 glass-card bg-transparent border-white/5 border-dashed">
        <Activity size={24} className="text-primary animate-pulse" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest">Active Monitoring Engaged</h4>
          <p className="text-[10px] text-muted">Controller is reading suite-wide telemetry every 300s for compliance drift.</p>
        </div>
      </div>
    </main>
  );
}
