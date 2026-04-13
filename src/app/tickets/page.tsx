import Link from 'next/link';
import { ArrowLeft, Clock, AlertCircle, CheckCircle, Zap, ShieldAlert } from 'lucide-react';
import { FixButton } from '@/components/fix-button';
import { PolicyService } from '@/lib/services/policy-service';

export default async function ResolutionCenter() {
  const openTickets = await PolicyService.getOpenTickets();
  const resolvedTickets = await PolicyService.getResolvedTickets();

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto pb-24">
      {/* Navigation */}
      <div className="mb-8">
        <Link href="/" className="text-secondary hover:text-white flex items-center gap-2 text-sm transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Policy Hub
        </Link>
      </div>

      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Resolution <span className="text-gradient">Center</span></h1>
        <p className="text-secondary text-sm">Active compliance tickets requiring diagnostic or remediation actions.</p>
      </header>

      <div className="space-y-4">
        {openTickets.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <CheckCircle className="text-success w-12 h-12 mb-4 opacity-20" />
            <p className="text-secondary font-medium">All systems compliant.</p>
            <p className="text-xs text-muted">No open tickets found in heidless-apps-0.</p>
          </div>
        ) : (
          openTickets.map((ticket) => (
            <div key={ticket.id} className="glass-card p-6 flex items-start gap-6 border-l-4 border-l-amber-500">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <AlertCircle size={24} />
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{ticket.title}</h3>
                    <div className="flex gap-3 mt-1 items-center">
                      <span className="text-[10px] font-mono text-muted uppercase px-2 py-0.5 rounded-full border border-white/5">
                        ID: {ticket.id.slice(0, 8)}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full 
                        ${ticket.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {ticket.priority} Priority
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted text-xs font-mono">
                    <Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-sm text-secondary mb-6 leading-relaxed">
                  {ticket.description}
                </p>

                <div className="flex gap-4">
                  <FixButton ticketId={ticket.id} />
                  <Link href={`/tickets/${ticket.id}`} className="px-4 py-2 bg-white/5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/5">
                    View Diagnostics
                  </Link>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest text-right">Target Policy</div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <ShieldAlert size={14} className="text-secondary" />
                  <span className="text-xs font-medium">{ticket.policyId}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Audit Trail / History */}
      {resolvedTickets.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center gap-2 mb-6 text-muted">
            <CheckCircle size={18} className="text-success" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Audit Trail: Resolved Actions</h2>
          </div>
          
          <div className="space-y-3">
            {resolvedTickets.map((ticket) => (
              <div key={ticket.id} className="glass-card p-4 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{ticket.title}</h4>
                    <p className="text-[10px] text-muted">Remediated on {new Date(ticket.updatedAt).toLocaleDateString()} via Active Controller</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 text-[10px] uppercase font-mono border border-white/5">
                  {ticket.policyId}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manual Resolution Guidance */}
      <footer className="mt-12 p-6 glass-card border-dashed bg-transparent border-white/10">
        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
          <Zap size={16} className="text-primary" /> Active Remediation Protocol
        </h4>
        <p className="text-xs text-muted leading-relaxed">
          The "Active Fix" button triggers the Service Account Controller to push configuration updates to your app suite. 
          Ensure you have reviewed the diagnostic logs before initiating automated remediation. 
          Manual evidence upload is required for UK-GDPR and Online Safety Act audit trails.
        </p>
      </footer>
    </main>
  );
}
