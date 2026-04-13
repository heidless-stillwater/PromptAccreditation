'use client';

import { useState } from 'react';
import { FileUp, CheckCircle, Loader2 } from 'lucide-react';
import { resolveTicketManually } from '@/lib/actions';

export function EvidenceUploader({ ticketId }: { ticketId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceUrl) return;
    
    setIsPending(true);
    const res = await resolveTicketManually(ticketId, evidenceUrl, notes);
    setResult(res);
    setIsPending(false);
  };

  if (result?.success) {
    return (
      <div className="p-6 glass-card bg-success/10 border-success/20 flex flex-col items-center text-center">
        <CheckCircle className="text-success w-12 h-12 mb-2" />
        <h3 className="font-bold text-success">Verification Submitted</h3>
        <p className="text-xs text-secondary mt-1">Audit trail updated. Ticket marked as resolved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted flex items-center gap-2">
        <FileUp size={14} /> Manual Evidence Upload
      </h3>
      
      <div>
        <label className="block text-[10px] font-mono text-muted uppercase mb-1">Evidence URL / Reference</label>
        <input
          required
          type="text"
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="e.g. drive.google.com/audit-report-2025"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted uppercase mb-1">Compliance Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Evidence verification details..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !evidenceUrl}
        className="w-full py-2 bg-primary rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
      >
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
        {isPending ? 'Submitting...' : 'Mark as Compliant'}
      </button>
    </form>
  );
}
