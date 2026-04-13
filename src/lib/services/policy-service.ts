import {
  Policy,
  PolicyStatus,
  IntensityLevel,
  AuditCheck,
  WizardState,
} from '../types';
import { accreditationDb, resourcesDb, masterDb } from '../firebase-admin';
import { AuditService } from './audit-service';

export const PolicyService = {
  async getAllPolicies(): Promise<Policy[]> {
    const snap = await accreditationDb
      .collection('policies')
      .orderBy('category')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Policy));
  },

  async getPolicyById(id: string): Promise<Policy | null> {
    const doc = await accreditationDb.collection('policies').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Policy;
  },

  async getPolicyBySlug(slug: string): Promise<Policy | null> {
    const snap = await accreditationDb
      .collection('policies')
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Policy;
  },

  async getOpenTickets() {
    const { TicketService } = await import('./ticket-service');
    return TicketService.getOpenTickets();
  },

  async getResolvedTickets() {
    const { TicketService } = await import('./ticket-service');
    return TicketService.getResolvedTickets();
  },

  async updateCheckStatus(
    policyId: string,
    checkId: string,
    status: PolicyStatus,
    evidenceUrl?: string,
    actor = 'system'
  ): Promise<void> {
    const policyRef = accreditationDb.collection('policies').doc(policyId);
    const snap = await policyRef.get();
    if (!snap.exists) return;

    const policy = snap.data() as Policy;
    const updatedChecks = policy.checks.map((c) =>
      c.id === checkId
        ? { ...c, status, evidenceUrl: evidenceUrl ?? c.evidenceUrl, lastChecked: new Date() }
        : c
    );
    const newStatus = this.calculateAggregateStatus(updatedChecks);

    await policyRef.update({ checks: updatedChecks, status: newStatus, updatedAt: new Date() });
    await AuditService.log({
      action: 'check_status_updated',
      actor,
      targetType: 'check',
      targetId: checkId,
      details: { policyId, status, evidenceUrl },
    });
  },

  /**
   * Update intensity dial — also triggers cross-app systemic enforcement
   * when set to 'systemic'.
   */
  async updatePolicyIntensity(
    policyId: string,
    intensity: IntensityLevel,
    actor = 'system'
  ): Promise<void> {
    await accreditationDb
      .collection('policies')
      .doc(policyId)
      .update({ intensity, updatedAt: new Date() });

    if (intensity === 'systemic') {
      await this._triggerSystemicEnforcement(policyId);
    }

    await AuditService.log({
      action: 'policy_intensity_updated',
      actor,
      targetType: 'policy',
      targetId: policyId,
      details: { intensity },
    });
  },

  /** Systemic cross-app enforcement pushes */
  async _triggerSystemicEnforcement(policyId: string): Promise<void> {
    console.log(`[PolicyEngine] Triggering systemic enforcement: ${policyId}`);
    try {
      switch (policyId) {
        case 'online-safety-act':
          await resourcesDb
            .collection('system_config')
            .doc('protection')
            .set(
              { avStrictness: 'maximum', lastEnforcedBy: 'AccreditationController', enforcedAt: new Date() },
              { merge: true }
            );
          break;
        case 'site-security':
          await masterDb
            .collection('system_settings')
            .doc('compliance')
            .set(
              { encryptionForced: true, enforcedBy: 'AccreditationController', enforcedAt: new Date() },
              { merge: true }
            );
          break;
      }
    } catch (err) {
      console.error(`[PolicyEngine] Systemic enforcement failed for ${policyId}:`, err);
    }
  },

  /** Compute RAG status from checks array */
  calculateAggregateStatus(checks: AuditCheck[]): PolicyStatus {
    if (!checks.length) return 'amber';
    if (checks.every((c) => c.status === 'green')) return 'green';
    if (checks.some((c) => c.status === 'red')) return 'red';
    return 'amber';
  },

  /** Overall suite compliance % */
  async getComplianceScore(): Promise<number> {
    const policies = await this.getAllPolicies();
    const allChecks = policies.flatMap((p) => p.checks || []);
    if (!allChecks.length) return 100;
    const passed = allChecks.filter((c) => c.status === 'green').length;
    return Math.round((passed / allChecks.length) * 100);
  },

  // ═══════════════════════════════════════════════════════
  // WIZARD STATE
  // ═══════════════════════════════════════════════════════

  async getWizardState(policyId: string, userId: string): Promise<WizardState | null> {
    const doc = await accreditationDb
      .collection('wizard_states')
      .doc(`${policyId}_${userId}`)
      .get();
    if (!doc.exists) return null;
    return doc.data() as WizardState;
  },

  async startWizard(policyId: string, userId: string): Promise<WizardState> {
    const state: WizardState = {
      policyId,
      userId,
      currentStepIndex: 0,
      stepsCompleted: [],
      evidenceUploaded: {},
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };
    await accreditationDb
      .collection('wizard_states')
      .doc(`${policyId}_${userId}`)
      .set(state);
    return state;
  },

  async completeWizardStep(
    policyId: string,
    userId: string,
    stepId: string,
    evidenceUrl?: string
  ): Promise<void> {
    const docRef = accreditationDb.collection('wizard_states').doc(`${policyId}_${userId}`);
    const snap = await docRef.get();
    const state = snap.data() as WizardState;

    const stepsCompleted = [...(state.stepsCompleted || [])];
    if (!stepsCompleted.includes(stepId)) stepsCompleted.push(stepId);

    const evidenceUploaded = { ...state.evidenceUploaded };
    if (evidenceUrl) evidenceUploaded[stepId] = evidenceUrl;

    await docRef.update({
      stepsCompleted,
      evidenceUploaded,
      currentStepIndex: state.currentStepIndex + 1,
      lastActivityAt: new Date(),
    });
  },

  async skipWizardStep(
    policyId: string,
    userId: string,
    stepId: string
  ): Promise<void> {
    const docRef = accreditationDb.collection('wizard_states').doc(`${policyId}_${userId}`);
    const snap = await docRef.get();
    const state = snap.data() as WizardState;
    await docRef.update({
      currentStepIndex: state.currentStepIndex + 1,
      lastActivityAt: new Date(),
    });
  },
};
