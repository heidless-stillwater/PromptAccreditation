import Link from 'next/link';
import { TicketCheck, Clock, CheckCircle2, AlertTriangle, Zap, ChevronRight } from 'lucide-react';
import { TicketService } from '@/lib/services/ticket-service';
import { FixButton } from '@/components/shared/fix-button';
import { ScanButton } from '@/components/shared/scan-button';
import type { Metadata } from 'next';
import type { Ticket } from '@/lib/types';

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

function TicketCard({ ticket }: { ticket: Ticket }) {
  const hasActiveFix = !!ticket.remediation?.fixId;
  return (
    <div
      className="glass-card p-5"
      style={ticket.priority === 'critical' ? { borderLeft: '3px solid var(--status-red)' } : {}}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <span
            className="status-dot mt-1 flex-shrink-0"
            style={{
              background: PRIORITY_COLORS[ticket.priority] || 'var(--secondary)',
              boxShadow: `0 0 8px ${PRIORITY_COLORS[ticket.priority] || 'var(--secondary)'}`,
            }}
          />
          <div>
            <Link
              href={`/tickets/${ticket.id}`}
              className="text-sm font-semibold hover:underline"
              style={{ color: 'var(--foreground)', textDecoration: 'none' }}
            >
              {ticket.title}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`badge-${(ticket.priority || 'medium') === 'critical' ? 'red' : (ticket.priority || 'medium') === 'high' ? 'amber' : 'muted'}`}>
                {(ticket.priority || 'medium').toUpperCase()}
              </span>
              <span className="badge-muted">{(ticket.type || 'issue').replace(/_/g, ' ')}</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                #{ticket.id.slice(-6)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasActiveFix ? (
            <FixButton ticketId={ticket.id} fixId={ticket.remediation.fixId} />
          ) : (
            <Link href={`/tickets/${ticket.id}`} className="btn-ghost text-sm flex items-center gap-1">
              Review <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--secondary)' }}>
        {ticket.description}
      </p>
      <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
        <span>Policy: {ticket.policySlug}</span>
        {ticket.affectedApps?.length > 0 && (
          <span>Apps: {ticket.affectedApps.join(', ')}</span>
        )}
        {hasActiveFix && (
          <span className="flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
            <Zap size={10} /> Active Fix Available
          </span>
        )}
      </div>
    </div>
  );
}

export default async function TicketsPage() {
  const [open, resolved] = await Promise.all([
    TicketService.getOpenTickets(),
    TicketService.getResolvedTickets(),
  ]);

  const critical = open.filter((t) => t.priority === 'critical');

  return (
    <main className="p-8 max-w-5xl mx-auto animate-fade-in">
      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TicketCheck size={22} style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-3xl font-bold">Resolution Centre</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            Compliance tickets raised by automated scans and manual reviews.
          </p>
        </div>
        <ScanButton />
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Open',     value: open.length,     icon: Clock,         color: 'var(--status-amber)' },
          { label: 'Critical', value: critical.length, icon: AlertTriangle, color: 'var(--status-red)'   },
          { label: 'Resolved', value: resolved.length, icon: CheckCircle2,  color: 'var(--status-green)' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <s.icon size={18} style={{ color: s.color }} />
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--secondary)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Critical section */}
      {critical.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--status-red)' }}>
            <AlertTriangle size={14} /> Critical — Immediate Action Required
          </h2>
          <div className="space-y-3">
            {critical.map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        </section>
      )}

      {/* Open tickets */}
      <section className="mb-8">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Clock size={14} style={{ color: 'var(--status-amber)' }} />
          Open Tickets ({open.length})
        </h2>
        {open.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: 'var(--status-green)' }} />
            <p className="text-sm font-bold" style={{ color: '#34d399' }}>No open tickets</p>
            <p className="text-xs mt-1" style={{ color: 'var(--secondary)' }}>Run a suite scan to detect compliance drifts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {open.filter((t) => t.priority !== 'critical').map((t) => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--status-green)' }}>
            <CheckCircle2 size={14} /> Recently Resolved ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <CheckCircle2 size={14} style={{ color: 'var(--status-green)', flexShrink: 0 }} />
                <span className="text-xs flex-1 line-clamp-1" style={{ color: 'var(--secondary)' }}>{t.title}</span>
                <span className="badge-green">RESOLVED</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
