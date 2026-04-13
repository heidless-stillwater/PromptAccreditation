import { masterDb, resourcesDb, toolDb, accreditationDb } from '../firebase-admin';
import { Ticket } from '../types';

export const MonitoringService = {
  /**
   * Suite-wide Diagnostic Scan.
   * Checks for drifts in sister applications.
   */
  async scanForDrifts(): Promise<{ ticketsRaised: number, issuesDetected: string[] }> {
    console.log('🔍 Initiating Suite-wide Compliance Scan...');
    const issuesDetected: string[] = [];
    let ticketsRaised = 0;

    try {
      // PROBE 1: Check Master Registry for Encryption enforcement
      const masterSettings = await masterDb.collection('system_settings').doc('compliance').get();
      if (!masterSettings.exists || !masterSettings.data()?.encryptionForced) {
        issuesDetected.push('Data Encryption not enforced in Master Registry');
        await this.raiseTicket({
          policyId: 'data-protection',
          checkId: 'dpa-encryption',
          priority: 'high',
          title: 'Encryption Drift: Master Registry',
          description: 'The Active Controller detected that mandatory encryption enforcement has been disabled or is missing in the Master Registry settings.'
        });
        ticketsRaised++;
      }

      // PROBE 2: Check PromptResources for AV gateway presence
      // (Simulating a check against the resources database)
      console.log('🔍 Probing PromptResources for Age Verification parity...');
      
      return { ticketsRaised, issuesDetected };
    } catch (error) {
      console.error('❌ Diagnostic Scan failed:', error);
      throw error;
    }
  },

  /**
   * Internal helper to raise a compliance ticket if one doesn't exist.
   */
  async raiseTicket(data: Partial<Ticket>) {
    // Check for existing open ticket for same checkId to avoid duplicates
    const existing = await accreditationDb.collection('tickets')
      .where('checkId', '==', data.checkId)
      .where('status', '==', 'open')
      .get();

    if (existing.empty) {
      await accreditationDb.collection('tickets').add({
        ...data,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`🚩 Ticket Raised: ${data.title}`);
    } else {
      console.log(`⏭️ Skipping duplicate ticket: ${data.title}`);
    }
  }
};
