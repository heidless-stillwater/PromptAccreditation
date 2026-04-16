import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle2, XCircle, Clock, ChevronLeft, Zap, ExternalLink } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { TicketService } from '@/lib/services/ticket-service';
import { AuthService } from '@/lib/services/auth-service';
import { IntensityDialClient } from '@/components/policies/intensity-dial';
import { CheckRowClient } from '@/components/policies/check-row';
import { WizardPanel } from '@/components/policies/wizard-panel';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = await PolicyService.getPolicyBySlug(slug);
  return { title: policy?.name ?? 'Policy Detail' };
}

export default async function PolicyDetailPage({ params }: Props) {
  const { slug } = await params;
  const policy = await PolicyService.getPolicyBySlug(slug);
  if (!policy) notFound();

  const tickets = await TicketService.getTicketsByPolicy(policy.id);
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress');

  const user = await AuthService.getCurrentUser();
  const wizardState = user ? await PolicyService.getWizardState(policy.id, user.uid) : null;

  const total = policy.checks?.length ?? 0;
  const passed = policy.checks?.filter((c) => c.status === 'green').length ?? 0;

  return (
    <main className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Back */}
      <Link href="/policies" className="flex items-center gap-2 text-sm mb-8 hover:underline" style={{ color: 'var(--secondary)' }}>
        <ChevronLeft size={14} />
        Policy Hub
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`badge-${policy.status} text-sm`}>{policy.status.toUpperCase()}</span>
              <span className="badge-muted">{policy.regulatoryBody}</span>
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
                  stroke={policy.status === 'green' ? 'var(--status-green)' : policy.status === 'amber' ? 'var(--status-amber)' : 'var(--status-red)'}
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
          <WizardPanel policy={policy} initialWizardState={wizardState} userId={user?.uid} />
        </div>
      </div>
    </main>
  );
}
