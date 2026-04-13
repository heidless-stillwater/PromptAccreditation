import { accreditationDb, resourcesDb, masterDb, toolDb } from '../firebase-admin';
import { Policy, PolicyStatus, IntensityLevel, AuditCheck } from '../types';

export const PolicyService = {
    /**
     * Fetches all governance policies.
     */
    async getAllPolicies(): Promise<Policy[]> {
        const snapshot = await accreditationDb.collection('policies').orderBy('id').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Policy));
    },

    /**
     * Fetches a single policy by ID.
     */
    async getPolicyById(id: string): Promise<Policy | null> {
        const doc = await accreditationDb.collection('policies').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as Policy;
    },

    /**
     * Updates the status of an absolute audit check.
     */
    async updateCheckStatus(policyId: string, checkId: string, status: PolicyStatus, evidenceUrl?: string): Promise<void> {
        const policyRef = accreditationDb.collection('policies').doc(policyId);
        const policy = (await policyRef.get()).data() as Policy;
        
        const updatedChecks = policy.checks.map(check => 
            check.id === checkId 
                ? { ...check, status, evidenceUrl, lastChecked: new Date() } 
                : check
        );

        // Calculate New Aggregate RAG status
        const newStatus = this.calculateAggregateStatus(updatedChecks);

        await policyRef.update({
            checks: updatedChecks,
            status: newStatus,
            updatedAt: new Date()
        });
    },

    /**
     * Adjusts the intensity dial and triggers cross-app systemic enforcement.
     */
    async updatePolicyIntensity(policyId: string, intensity: IntensityLevel): Promise<void> {
        await accreditationDb.collection('policies').doc(policyId).update({
            intensity,
            updatedAt: new Date()
        });

        // SYSTEMIC ENFORCEMENT logic
        if (intensity === 'systemic') {
            console.log(`[PolicyEngine] Triggering systemic enforcement for: ${policyId}`);
            
            try {
                switch (policyId) {
                    case 'online-safety':
                        // Push maximum AV strictness to PromptResources
                        await resourcesDb.collection('system_config').doc('protection').set({
                            avStrictness: 'maximum',
                            lastEnforcedBy: 'AccreditationController',
                            enforcedAt: new Date()
                        }, { merge: true });
                        break;

                    case 'site-security':
                        // Enforce encryption in Master Registry
                        await masterDb.collection('system_settings').doc('compliance').set({
                            encryptionForced: true,
                            enforcedBy: 'AccreditationController',
                            enforcedAt: new Date()
                        }, { merge: true });
                        break;
                }
            } catch (err) {
                console.error(`[PolicyEngine] Cross-app enforcement failed for ${policyId}:`, err);
            }
        }
    },

    /**
     * Helper to compute RAG status based on check completion.
     */
    calculateAggregateStatus(checks: AuditCheck[]): PolicyStatus {
        if (checks.every(c => c.status === 'green')) return 'green';
        if (checks.some(c => c.status === 'red')) return 'red';
        return 'amber';
    }
};
