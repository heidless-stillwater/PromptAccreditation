// 'use server';

import { TicketService } from '@/lib/services/ticket-service';
import { revalidatePath } from 'next/cache';

export async function addTicketComment(formData: FormData) {
  const ticketId = formData.get('ticketId') as string;
  const content = formData.get('content') as string;
  const actor = formData.get('actor') as string || 'system';

  if (!ticketId || !content) return { success: false, error: 'Missing data' };

  try {
    await TicketService.addTimelineEntry(ticketId, {
      action: 'Comment added',
      actor,
      details: content,
    });
    
    // revalidatePath(`/tickets/${ticketId}`);
    return { success: true };
  } catch (err) {
    console.error('Failed to add comment:', err);
    return { success: false, error: 'Failed to add comment' };
  }
}
