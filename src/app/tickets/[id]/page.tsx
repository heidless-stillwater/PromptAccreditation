import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, TicketCheck, Calendar, User, Clock, Shield, Zap, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { TicketService } from '@/lib/services/ticket-service';
import { FixButton } from '@/components/shared/fix-button';
import { DeleteTicketButton } from '@/components/tickets/delete-ticket-button';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { TicketResponseForm } from '@/components/tickets/ticket-response-form';

interface Props {
  params: Promise<{ id: string }>;
}

/* 
export async function generateStaticParams() {
  const tickets = await TicketService.getAllTickets();
  return tickets.map((t) => ({
    id: t.id,
  }));
}
*/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  // DIAGNOSTIC BYPASS: Return dummy data to check if server is hanging on DB
  const ticket: any = {
      id,
      title: 'DIAGNOSTIC_TICKET',
      description: 'If you see this, the server is NOT hanging. The DB is the culprit.',
      priority: 'high',
      status: 'open',
      type: 'compliance_gap',
      policySlug: 'dpa',
      timeline: []
  };

  return { title: ticket?.title || 'Ticket Details' };
}

export default async function TicketDetailPage({ params }: Props) {
  const { id: ticketId } = await params;
  const { withTimeout, accreditationDb } = await import('@/lib/firebase-admin');

  try {
    const { AuditService } = await import('@/lib/services/audit-service');
    const { RemediationService } = await import('@/lib/services/remediation-service');

    const [ticket, auditLogs] = await withTimeout(Promise.all([
        accreditationDb.collection('tickets').doc(ticketId).get(),
        accreditationDb.collection('audit_logs').where('targetId', '==', ticketId).get(),
    ]), 8000) as [any, any];

    if (!ticket.exists) notFound();
    const ticketData = { id: ticket.id, ...ticket.data() };
    
    // Fetch resource details if available from the Resources Hub
    let remediationResource = null;
    if (ticketData.remediation?.resourceId) {
        try {
            const { resourcesDb } = await import('@/lib/firebase-admin');
            const resourceDoc = await withTimeout(
                resourcesDb.collection('resources').doc(ticket.remediation.resourceId).get(),
                5000
            ) as any;
            if (resourceDoc.exists) {
                remediationResource = { id: resourceDoc.id, ...resourceDoc.data() };
            }
        } catch (e) {
            console.warn('[TicketDetailPage] Remediation Resource fetch timed out or failed.');
        }
    }



  const isResolved = ticket.status === 'resolved' || ticket.status === 'wont_fix';

  return (
    <main className="p-8 max-w-5xl mx-auto animate-fade-in">
      <Link href="/tickets" className="flex items-center gap-2 text-sm mb-8 hover:underline" style={{ color: 'var(--secondary)' }}>
        <ChevronLeft size={14} />
        Back to Inbox
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Detail */}
        <div className="lg:col-span-2 space-y-6">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className={`badge-${(ticket.status || 'open') === 'open' ? 'red' : (ticket.status || 'open') === 'in_progress' ? 'amber' : 'green'}`}>
                {(ticket.status || 'open').replace('_', ' ')}
              </span>
              <span className="text-[11px] font-mono tracking-wider opacity-60 uppercase">
                {ticket.id.slice(0, 8)} // {(ticket.type || 'compliance_gap').replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-4">{ticket.title}</h1>
            <div className="flex flex-wrap gap-6 text-sm" style={{ color: 'var(--secondary)' }}>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-500" />
                <span>Policy: <Link href={`/policies/${ticket.policySlug}`} className="text-blue-400 hover:underline">{ticket.policySlug}</Link></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Raised {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM dd, HH:mm') : 'Unknown'}</span>
              </div>
            </div>
          </header>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Description</h2>
            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{ticketData.description}</p>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-6">Timeline</h2>
            <div className="space-y-6">
              {ticketData.timeline?.map((entry: any, idx: number) => (
                <div key={idx} className="relative pl-8">
                  {idx !== ticketData.timeline.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-[1px] bg-white/5" />
                  )}
                  <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="w-[5px] h-[5px] rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{entry.action}</span>
                      <span className="text-xs opacity-50 font-mono">
                        {entry.timestamp ? format(new Date(entry.timestamp), 'HH:mm:ss') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      By {typeof entry.actor === 'object' ? (entry.actor as any)?.email || JSON.stringify(entry.actor) : entry.actor}
                    </p>
                    {entry.details && (
                      <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-xs text-slate-400 font-mono">
                        {entry.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TicketResponseForm ticketId={ticketData.id} />
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-6 opacity-60">Status Control</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--secondary)' }}>Priority</span>
                <span className={`font-bold ${(ticketData.priority || 'medium') === 'critical' ? 'text-red-500' : (ticketData.priority || 'medium') === 'high' ? 'text-orange-500' : 'text-blue-500'}`}>
                  {(ticketData.priority || 'medium').toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--secondary)' }}>Severity</span>
                <span className="font-bold">{(ticketData.severity || 'major').toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--secondary)' }}>Assignee</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User size={12} className="text-blue-400" />
                  </div>
                  <span className="font-bold">{ticketData.assignee || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {!isResolved && ticketData.remediation?.type === 'active_fix' && (
                <FixButton ticketId={ticketData.id} fixId={ticketData.remediation.fixId} />
              )}
              {!isResolved && (
                <button className="btn-ghost w-full justify-center">
                  Close as Won't Fix
                </button>
              )}
              <DeleteTicketButton ticketId={ticketData.id} />
              {isResolved && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-bold text-green-400">Resolved</p>
                  <p className="text-[10px] text-green-500/60 font-mono mt-1">
                    {ticketData.remediation?.resolvedAt ? format(new Date(ticketData.remediation.resolvedAt), 'yyyy-MM-dd HH:mm') : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 opacity-60">Affected Assets</h2>
            <div className="space-y-2">
              {(ticketData.affectedApps || []).map((app: string) => (
                <div key={app} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-xs font-mono">{app}</span>
                  </div>
                  {app === 'promptresources' && ticketData.remediation?.resourceId && (
                    <a 
                      href={`http://localhost:3002/resources/${ticketData.remediation.resourceId}?ticketId=${ticketData.id}&returnUrl=${encodeURIComponent(`http://localhost:3003/tickets/${ticketData.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-tighter"
                    >
                      Review Details <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-400 mb-1">Knowledge Link</p>
                <p className="text-[11px] text-blue-500/70 leading-relaxed mb-3">
                  This issue is linked to the <strong>{ticket.policySlug}</strong> compliance handbook. 
                  Ask the Policy AI for more specific remediation steps.
                </p>
                <Link href="/knowledge/chat" className="text-[10px] font-bold text-blue-400 flex items-center gap-1 hover:underline">
                  Open Policy AI Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    );
  } catch (error: any) {
    if (error.digest === 'NEXT_NOT_FOUND') throw error;
    console.error('[TicketDetailPage] Critical Error:', error);
    return notFound();
  }
}
