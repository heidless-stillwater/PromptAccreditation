import { accreditationDb } from '../firebase-admin';
import { masterDb, resourcesDb, toolDb } from '../firebase-admin';
import { Ticket } from '../types';
import { AuditService } from './audit-service';
import { TicketService } from './ticket-service';

type FixResult = { success: boolean; message: string };

// ═══════════════════════════════════════════════════════
// FIX FUNCTION REGISTRY
// Maps fixId strings to actual cross-app Firestore writes
// ═══════════════════════════════════════════════════════
const FIX_FUNCTIONS: Record<string, (ticket: Ticket) => Promise<void>> = {
  'fix-av-gateway': async () => {
    await resourcesDb.collection('system_config').doc('protection').set(
      {
        avEnabled: true,
        avStrictness: 'standard',
        lastEnforcedBy: 'AccreditationController',
        enforcedAt: new Date(),
      },
      { merge: true }
    );
  },

  'fix-encryption': async () => {
    await masterDb.collection('system_settings').doc('compliance').set(
      {
        encryptionForced: true,
        enforcedBy: 'AccreditationController',
        enforcedAt: new Date(),
      },
      { merge: true }
    );
  },

  'fix-security-headers': async () => {
    await toolDb.collection('system_config').doc('security').set(
      {
        strictTransportSecurity: true,
        contentSecurityPolicy: "default-src 'self'",
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        referrerPolicy: 'strict-origin-when-cross-origin',
        enforcedBy: 'AccreditationController',
        enforcedAt: new Date(),
      },
      { merge: true }
    );
  },

  'fix-data-audit': async () => {
    await masterDb.collection('system_settings').doc('data_governance').set(
      {
        auditEnabled: true,
        retentionDays: 365,
        enforcedBy: 'AccreditationController',
        enforcedAt: new Date(),
      },
      { merge: true }
    );
  },
};

export const RemediationService = {
  /**
   * Execute an active fix for a ticket.
   * Looks up the fix function from the ticket's remediation.fixId.
   */
  async executeFix(ticket: Ticket): Promise<FixResult> {
    const fixId = ticket.remediation?.fixId;

    if (!fixId) {
      return { success: false, message: 'No automated fix defined for this ticket.' };
    }

    const fn = FIX_FUNCTIONS[fixId];
    if (!fn) {
      return { success: false, message: `Fix function '${fixId}' not registered.` };
    }

    try {
      await fn(ticket);

      // Mark ticket resolved
      await TicketService.resolveTicket(ticket.id, {
        type: 'active_fix',
        resolvedBy: 'AccreditationController',
        notes: `Automated fix '${fixId}' applied successfully.`,
      });

      await AuditService.log({
        action: 'active_fix_applied',
        actor: 'AccreditationController',
        targetType: 'ticket',
        targetId: ticket.id,
        details: { fixId, policyId: ticket.policyId },
      });

      return { success: true, message: `Fix '${fixId}' applied and ticket resolved.` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[RemediationService] Fix '${fixId}' failed:`, msg);
      return { success: false, message: `Fix failed: ${msg}` };
    }
  },

  /** List available fix IDs */
  getAvailableFixes(): string[] {
    return Object.keys(FIX_FUNCTIONS);
  },
};
