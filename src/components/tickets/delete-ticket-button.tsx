'use client';

import { useState, useTransition } from 'react';
import { deleteTicketAction } from '@/lib/actions';
import { Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteTicketButtonProps {
  ticketId: string;
}

export function DeleteTicketButton({ ticketId }: DeleteTicketButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  function handleDelete() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    startTransition(async () => {
      const res = await deleteTicketAction(ticketId);
      if (res.success) {
        router.push('/tickets');
        router.refresh();
      } else {
        alert(res.message);
        setConfirmed(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={confirmed ? 'btn-danger w-full justify-center' : 'btn-ghost w-full justify-center text-red-400 hover:text-red-500'}
        style={isPending ? { opacity: 0.7 } : {}}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin mr-2" />
        ) : (
          <Trash2 size={14} className="mr-2" />
        )}
        {isPending ? 'Deleting...' : confirmed ? 'Confirm Delete?' : 'Delete Ticket'}
      </button>

      {confirmed && !isPending && (
        <button
          onClick={() => setConfirmed(false)}
          className="text-[10px] text-center opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest font-bold"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
