import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { EvidenceUploader } from '@/components/evidence-uploader';
import { FixButton } from '@/components/fix-button';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketDetail({ params }: Params) {
  const { id } = await params;
  const ticket = await PolicyService.getTicketById(id);

  if (!ticket) {
    return notFound();
  }

  const isResolved = ticket.status === 'resolved';

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto pb-24">
      {/* Navigation */}
      <div className="mb-8 flex justify-between items-center">
        <Link href="/tickets" className="text-secondary hover:text-white flex items-center gap-2 text-sm transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Tickets
        </Link>
        <span className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full border
          ${isResolved ? 'border-success text-success bg-success/5' : 'border-amber-500 text-amber-500 bg-amber-500/5'}`}>
          {ticket.status}
        </span>
      </div>

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            <AlertTriangle className={isResolved ? 'text-success' : 'text-amber-500'} size={20} />
          </div>
          <h1 className="text-3xl font-bold">{ticket.title}</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 text-xs font-mono text-muted mb-8">
          <div className="flex items-center gap-1">
            <Clock size={12} /> Registered: {new Date(ticket.createdAt).toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <Info size={12} /> Priority: <span className="text-white">{ticket.priority.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} /> Policy: <span className="text-primary">{ticket.policyId}</span>
          </div>
        </div>

        <section className="glass-card p-8 mb-8 border-l-4 border-l-primary/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-4">Diagnostic Overview</h2>
          <p className="text-secondary leading-relaxed">
            {ticket.description}
          </p>
        </section>

        {!isResolved && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Automated Resolution</h2>
              <div className="glass-card p-6 bg-primary/5 border-primary/20">
                <p className="text-xs text-secondary mb-4">Trigger the Active Controller to execute the predefined remediation strategy for this check.</p>
                <FixButton ticketId={ticket.id} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Manual Resolution</h2>
              <EvidenceUploader ticketId={ticket.id} />
            </section>
          </div>
        )}

        {isResolved && (
          <section className="glass-card p-8 bg-success/5 border-success/20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-success mb-4 flex items-center gap-2">
              <ShieldCheck size={18} /> Resolution Evidence
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-muted uppercase mb-1">Evidence Provided</label>
                <div className="text-sm text-white font-mono break-all bg-white/5 p-3 rounded-lg border border-white/5">
                  {ticket.evidenceUrl || 'Automated Remediation (No manual evidence required)'}
                </div>
              </div>
              {ticket.notes && (
                <div>
                  <label className="block text-[10px] font-mono text-muted uppercase mb-1">Resolution Notes</label>
                  <div className="text-sm text-secondary bg-white/5 p-3 rounded-lg border border-white/5">
                    {ticket.notes}
                  </div>
                </div>
              )}
              <div className="text-[10px] text-muted text-right">
                Resolved on {new Date(ticket.updatedAt).toLocaleString()}
              </div>
            </div>
          </section>
        )}
      </header>
    </main>
  );
}
