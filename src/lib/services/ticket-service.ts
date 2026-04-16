import { accreditationDb } from '../firebase-admin';
import { Ticket, TicketStatus, TimelineEntry, RemediationType } from '../types';
import { AuditService } from './audit-service';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Sanitize Firestore data for RSC (Server Components).
 */
function sanitize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) return (data.toDate().toISOString() as unknown) as T;
  if (data instanceof Date) return (data.toISOString() as unknown) as T;
  if (Array.isArray(data)) return data.map(sanitize) as unknown as T;
  if (typeof data === 'object') {
    const obj = { ...data } as any;
    for (const key in obj) {
      obj[key] = sanitize(obj[key]);
    }
    return obj;
  }
  return data;
}

export const TicketService = {
  async createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await accreditationDb.collection('tickets').add({
      ...data,
      timeline: [
        {
          timestamp: new Date(),
          action: 'Ticket created',
          actor: data.assignee || 'system',
          details: `Auto-raised for policy: ${data.policySlug}`,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await AuditService.log({
      action: 'ticket_created',
      actor: data.assignee || 'system',
      targetType: 'ticket',
      targetId: ref.id,
      details: { title: data.title, policyId: data.policyId, priority: data.priority },
    });

    return ref.id;
  },

  async getOpenTickets(): Promise<Ticket[]> {
    const snap = await accreditationDb
      .collection('tickets')
      .where('status', 'in', ['open', 'in_progress'])
      .orderBy('createdAt', 'desc')
      .get();
    return sanitize(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket)));
  },

  async getResolvedTickets(): Promise<Ticket[]> {
    const snap = await accreditationDb
      .collection('tickets')
      .where('status', 'in', ['resolved', 'wont_fix'])
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();
    return sanitize(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket)));
  },

  async getTicketById(id: string): Promise<Ticket | null> {
    const doc = await accreditationDb.collection('tickets').doc(id).get();
    if (!doc.exists) return null;
    return sanitize({ id: doc.id, ...doc.data() } as Ticket);
  },

  async getTicketsByPolicy(policyId: string): Promise<Ticket[]> {
    const snap = await accreditationDb
      .collection('tickets')
      .where('policyId', '==', policyId)
      .orderBy('createdAt', 'desc')
      .get();
    return sanitize(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket)));
  },

  async updateTicketStatus(id: string, status: TicketStatus, actor = 'system'): Promise<void> {
    await accreditationDb.collection('tickets').doc(id).update({
      status,
      updatedAt: new Date(),
    });
    await this.addTimelineEntry(id, {
      action: `Status changed to ${status}`,
      actor,
    });
  },

  async resolveTicket(
    id: string,
    resolution: { type: RemediationType; evidenceUrl?: string; notes?: string; resolvedBy?: string }
  ): Promise<void> {
    await accreditationDb.collection('tickets').doc(id).update({
      status: 'resolved',
      remediation: {
        type: resolution.type,
        evidenceUrl: resolution.evidenceUrl || null,
        notes: resolution.notes || null,
        resolvedBy: resolution.resolvedBy || 'system',
        resolvedAt: new Date(),
      },
      updatedAt: new Date(),
    });
    await this.addTimelineEntry(id, {
      action: 'Ticket resolved',
      actor: resolution.resolvedBy || 'system',
      details: resolution.notes,
    });
    await AuditService.log({
      action: 'ticket_resolved',
      actor: resolution.resolvedBy || 'system',
      targetType: 'ticket',
      targetId: id,
      details: { type: resolution.type },
    });
  },

  async addTimelineEntry(
    ticketId: string,
    entry: Omit<TimelineEntry, 'timestamp'>
  ): Promise<void> {
    const doc = await accreditationDb.collection('tickets').doc(ticketId).get();
    if (!doc.exists) return;
    const existing: TimelineEntry[] = doc.data()?.timeline || [];
    await accreditationDb.collection('tickets').doc(ticketId).update({
      timeline: [...existing, { ...entry, timestamp: new Date() }],
      updatedAt: new Date(),
    });
  },

  /** Raise a ticket only if no open ticket exists for the same checkId */
  async raiseIfNotDuplicate(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    const existing = await accreditationDb
      .collection('tickets')
      .where('checkId', '==', data.checkId)
      .where('status', 'in', ['open', 'in_progress'])
      .get();

    if (!existing.empty) {
      const ticketId = existing.docs[0].id;
      console.log(`[TicketService] Duplicate detected for ${data.checkId}. Updating fixId...`);
      console.log(`[TicketService] Force-patching ticket ${ticketId} with fixId: ${data.remediation.fixId}`);
      await accreditationDb.collection('tickets').doc(ticketId).update({
        'remediation.fixId': data.remediation.fixId,
        updatedAt: new Date()
      });
      return null;
    }
    return this.createTicket(data);
  },
};
