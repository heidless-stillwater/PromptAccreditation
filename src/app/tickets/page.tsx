import Link from 'next/link';
import { TicketCheck, Clock, CheckCircle2, AlertTriangle, Zap, ChevronRight, ExternalLink } from 'lucide-react';
import { TicketService } from '@/lib/services/ticket-service';
import { FixButton } from '@/components/shared/fix-button';
import { ScanButton } from '@/components/shared/scan-button';
import type { Metadata } from 'next';
import type { Ticket } from '@/lib/types';



export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Resolution Centre',
  description: 'Manage and resolve compliance tickets',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--status-red)',
  high: 'var(--status-amber)',
  medium: 'var(--color-primary)',
  low: 'var(--secondary)',
};

const FIX_SUMMARIES: Record<string, string> = {
  'encryption_enforcement_fix': 'Enforce AES-256-GCM encryption across all satellite shards.',
  'encryption-enforcement': 'Enforce AES-256-GCM encryption across all satellite shards.',
  'av_gateway_fix': 'Deploy a technical age-verification gateway on Port 3002.',
  'fix-av-gateway': 'Deploy a technical age-verification gateway on Port 3002.',
  'moderation_baseline_fix': 'Synchronize global content moderation and safety baselines.',
  'fix-content-moderation': 'Synchronize global content moderation and safety baselines.',
  'fix-data-audit': 'Restore administrative telemetry and clinical audit trails.',
  'reinstate_content': 'Restore flagged resource to public view and remove user strikes.',
  'archive_content': 'Move tainted resource to secure administrative archive.',
  'fix-encryption': 'Harden database encryption settings.',
};

function TicketCard({ ticket }: { ticket: Ticket }) {
  const hasActiveFix = !!ticket.remediation?.fixId;
  const fixSummary = ticket.remediation?.fixId ? FIX_SUMMARIES[ticket.remediation.fixId] : null;

  return (
    <div
      className="glass-card p-6 group transition-all duration-300"
      style={ticket.priority === 'critical' ? { borderLeft: '4px solid var(--danger)' } : {}}
    >
      <div className="flex items-start justify-between gap-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="mt-1.5 relative">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: PRIORITY_COLORS[ticket.priority] || 'var(--text-muted)',
                boxShadow: `0 0 12px ${PRIORITY_COLORS[ticket.priority] || 'var(--text-muted)'}`,
              }}
            />
            {ticket.priority === 'critical' && (
              <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: 'var(--danger)' }} />
            )}
          </div>
          <div>
            <Link
              href={`/tickets/${ticket.id}`}
              className="text-base font-bold text-white group-hover:text-teal-400 transition-colors block mb-1.5"
            >
              {ticket.title}
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`badge-${(ticket.priority || 'medium') === 'critical' ? 'red' : (ticket.priority || 'medium') === 'high' ? 'amber' : 'muted'}`}>
                {(ticket.priority || 'medium').toUpperCase()}
              </div>
              <div className="badge-muted">{(ticket.type || 'issue').replace(/_/g, ' ')}</div>
              {ticket.affectedApps?.map((app: string) => (
                <div key={app} className="flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] font-black uppercase tracking-widest">
                  {app.replace('prompt', 'Prompt')}
                </div>
              ))}
              <span className="text-[10px] font-mono text-slate-600 font-bold">
                #{ticket.id.slice(-6)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
          {ticket.remediation?.resourceId && (
            <a 
              href={`http://localhost:3002/resources/${ticket.remediation.resourceId}?ticketId=${ticket.id}&returnUrl=${encodeURIComponent('http://localhost:3003/tickets')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 border-teal-500/20 text-teal-400 bg-teal-500/5 hover:bg-teal-500/15"
            >
              <ExternalLink size={12} /> Open Source
            </a>
          )}
          {hasActiveFix ? (
            <FixButton ticketId={ticket.id} fixId={ticket.remediation.fixId} />
          ) : (
            <Link href={`/tickets/${ticket.id}`} className="btn-ghost text-xs font-bold flex items-center gap-1 px-4 py-2 hover:text-teal-400">
              Review <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400 mb-5 leading-relaxed max-w-3xl">
        {ticket.description}
      </p>

      {hasActiveFix && fixSummary && (
        <div className="mb-5 p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/40" />
          <div className="flex items-center gap-2 text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-2">
            <Zap size={12} className="fill-teal-500" /> Predictive Action
          </div>
          <p className="text-[11px] font-bold text-slate-300 leading-relaxed italic opacity-80">
            {fixSummary}
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-slate-600">
        <span className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
           Policy: <span className="text-slate-500">{ticket.policySlug}</span>
        </span>
        {hasActiveFix && (
          <span className="flex items-center gap-1.5 text-teal-500/80">
            <Zap size={10} className="fill-teal-500/80" /> Active Fix Ready
          </span>
        )}
      </div>
    </div>
  );
}

export default async function TicketsPage() {
  const { withTimeout } = await import('@/lib/firebase-admin');

  let open: any[] = [];
  let resolved: any[] = [];

  try {
    const results = await withTimeout(Promise.all([
      TicketService.getOpenTickets(),
      TicketService.getResolvedTickets(),
    ]), 8000);
    open = results[0];
    resolved = results[1];
  } catch (error) {
    console.error('[TicketsPage] Database Timeout/Error:', error);
  }

  const critical = open.filter((t) => t.priority === 'critical');

  return (
    <main className="max-w-7xl mx-auto p-8 animate-fade-in space-y-12">
      <header className="flex justify-between items-end border-b border-teal-500/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TicketCheck size={22} className="text-teal-500" />
            <h1 className="text-3xl font-bold font-outfit">Resolution Centre</h1>
          </div>
          <p className="text-sm font-medium text-slate-400">
            Manage and resolve compliance drifts detected across the Prompt App Suite.
          </p>
        </div>
        <ScanButton />
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Open Tickets', value: open.length, icon: Clock, color: 'var(--warning)' },
          { label: 'Critical Issues', value: critical.length, icon: AlertTriangle, color: 'var(--danger)' },
          { label: 'Resolved', value: resolved.length, icon: CheckCircle2, color: 'var(--success)' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-6 flex items-center gap-5 group">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all"
              style={{ color: s.color }}
            >
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold font-outfit text-white">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Critical section */}
      {critical.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <AlertTriangle size={14} className="text-rose-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">
              Critical Remediation Required
            </h2>
          </div>
          <div className="space-y-4">
            {critical.map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        </section>
      )}

      {/* Open tickets */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Clock size={14} className="text-teal-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Open Tickets ({open.length})
            </h2>
          </div>
        </div>

        {open.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-teal-500/20">
            <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500" />
            <p className="text-lg font-bold text-white">Suite Synchronized</p>
            <p className="text-sm text-slate-500 mt-2">No open compliance tickets detected.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {open.filter((t) => t.priority !== 'critical').map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Recently Resolved ({resolved.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resolved.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="glass-card p-4 flex items-center gap-4 hover:border-teal-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors block truncate">{t.title}</span>
                  <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-tighter">Verified Resolved</span>
                </div>
                <ChevronRight size={14} className="text-slate-700 group-hover:text-teal-500 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

