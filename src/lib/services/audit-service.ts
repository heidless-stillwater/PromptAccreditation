import { accreditationDb } from '../firebase-admin';
import { AuditLogEntry } from '../types';
import fs from 'fs/promises';
import path from 'path';

export const AuditService = {
  /**
   * Write an immutable audit log entry.
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    await accreditationDb.collection('audit_log').add({
      ...entry,
      timestamp: new Date(),
    });
  },

  /**
   * Fetch the most recent N audit log entries.
   */
  async getRecentLogs(limit = 50): Promise<AuditLogEntry[]> {
    const snap = await accreditationDb
      .collection('audit_log')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp;
      return { id: d.id, ...data, timestamp } as AuditLogEntry;
    });
  },

  /**
   * Fetch audit entries for a specific target entity.
   */
  async getLogsByTarget(
    targetType: AuditLogEntry['targetType'],
    targetId: string
  ): Promise<AuditLogEntry[]> {
    const snap = await accreditationDb
      .collection('audit_log')
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .get();
    
    return snap.docs
      .map((d) => {
        const data = d.data();
        // Serialization Fix: Convert Firestore Timestamp class to serializable Date
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp;
        return { id: d.id, ...data, timestamp } as AuditLogEntry;
      })
      .sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeB - timeA;
      });
  },

  /**
   * Export all audit entries within a date range.
   */
  async exportAuditTrail(startDate: Date, endDate: Date): Promise<AuditLogEntry[]> {
    const snap = await accreditationDb
      .collection('audit_log')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .orderBy('timestamp', 'asc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
  },
  /**
   * Fetch the content of our persistent shadow log.
   */
  async getLastOperationResults(): Promise<string> {
    try {
      const filePath = path.join(process.cwd(), 'docs', 'LAST_OPERATION_RESULTS.md');
      return await fs.readFile(filePath, 'utf-8');
    } catch (e) {
      return '# No active instructions found. \nReady for new tasks.';
    }
  },
};
