'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { addTicketComment } from '@/lib/actions/ticket-actions';
import { useAuth } from '@/providers/auth-provider';

interface Props {
  ticketId: string;
}

export function TicketResponseForm({ ticketId }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    setIsPending(true);
    const formData = new FormData();
    formData.append('ticketId', ticketId);
    formData.append('content', content);
    formData.append('actor', user?.email || 'system');

    try {
      const result = await addTicketComment(formData);
      if (result.success) {
        setContent('');
      } else {
        alert('Failed to add comment');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 border-t-2 border-t-blue-500/30">
      <h3 className="text-sm font-bold tracking-widest uppercase mb-4 opacity-60">Add Response</h3>
      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your response or clinical notes here..."
          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm min-h-[120px] focus:outline-none focus:border-blue-500/50 transition-all text-slate-200"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isPending}
            className="btn-primary flex items-center gap-2 px-6 py-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Post Response
          </button>
        </div>
      </div>
    </form>
  );
}
