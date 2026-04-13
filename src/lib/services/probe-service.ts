import { accreditationDb, masterDb, resourcesDb, toolDb } from '../firebase-admin';
import { ProbeDefinition, ScanResult, PolicyStatus } from '../types';
import { AuditService } from './audit-service';

// ═══════════════════════════════════════════════════════
// PROBE DEFINITIONS REGISTRY
// ═══════════════════════════════════════════════════════
const PROBE_REGISTRY: ProbeDefinition[] = [
  {
    id: 'probe-av-gateway',
    name: 'Age Verification Gateway',
    description: 'Checks if AV config exists in PromptResources',
    type: 'db_config',
    targetDb: 'promptresources-db-0',
    targetPath: 'system_config/protection',
    expectedCondition: 'avEnabled === true',
    fixFunctionId: 'fix-av-gateway',
  },
  {
    id: 'probe-content-moderation',
    name: 'Content Moderation Active',
    description: 'Checks content moderation config in PromptResources',
    type: 'db_config',
    targetDb: 'promptresources-db-0',
    targetPath: 'system_config/moderation',
    expectedCondition: 'enabled === true',
    fixFunctionId: undefined,
  },
  {
    id: 'probe-encryption-enforcement',
    name: 'Encryption Enforcement',
    description: 'Checks encryption is forced in Master Registry',
    type: 'db_config',
    targetDb: 'promptmaster-db-0',
    targetPath: 'system_settings/compliance',
    expectedCondition: 'encryptionForced === true',
    fixFunctionId: 'fix-encryption',
  },
  {
    id: 'probe-data-audit',
    name: 'Data Audit Logging Active',
    description: 'Checks audit logging is enabled in Master Registry',
    type: 'db_config',
    targetDb: 'promptmaster-db-0',
    targetPath: 'system_settings/data_governance',
    expectedCondition: 'auditEnabled === true',
    fixFunctionId: 'fix-data-audit',
  },
  {
    id: 'probe-security-headers',
    name: 'Security Header Config',
    description: 'Checks security header config in PromptTool',
    type: 'db_config',
    targetDb: 'prompttool-db-0',
    targetPath: 'system_config/security',
    expectedCondition: 'strictTransportSecurity === true',
    fixFunctionId: 'fix-security-headers',
  },
];

/** Get the Firestore DB reference by database ID string */
function getDbByName(dbId: string) {
  switch (dbId) {
    case 'promptmaster-db-0': return masterDb;
    case 'promptresources-db-0': return resourcesDb;
    case 'prompttool-db-0': return toolDb;
    case 'promptaccreditation-db-0': return accreditationDb;
    default: return null;
  }
}

/** Evaluate a simple JS-like condition string against a data object */
function evaluateCondition(condition: string, data: Record<string, unknown>): boolean {
  try {
    // Safely evaluate by injecting data keys into scope
    const fn = new Function(...Object.keys(data), `return (${condition});`);
    return fn(...Object.values(data)) === true;
  } catch {
    return false;
  }
}

export const ProbeService = {
  getAllProbes(): ProbeDefinition[] {
    return PROBE_REGISTRY;
  },

  getProbeById(id: string): ProbeDefinition | undefined {
    return PROBE_REGISTRY.find((p) => p.id === id);
  },

  /**
   * Execute a single probe.
   * For db_config probes: reads Firestore doc and evaluates the condition.
   */
  async executeProbe(probe: ProbeDefinition): Promise<ScanResult> {
    const now = new Date();

    try {
      if (probe.type === 'db_config') {
        const db = getDbByName(probe.targetDb);
        if (!db) {
          return {
            checkId: probe.id,
            policyId: '',
            probeId: probe.id,
            appTarget: probe.targetDb,
            status: 'amber' as PolicyStatus,
            message: `Unknown target database: ${probe.targetDb}`,
            probeType: 'db_config',
            executedAt: now,
          };
        }

        const [collection, docId] = probe.targetPath.split('/');
        const doc = await db.collection(collection).doc(docId).get();

        if (!doc.exists) {
          return {
            checkId: probe.id,
            policyId: '',
            probeId: probe.id,
            appTarget: probe.targetDb,
            status: 'red' as PolicyStatus,
            message: `Config document not found: ${probe.targetPath}`,
            probeType: 'db_config',
            rawData: {},
            executedAt: now,
          };
        }

        const data = doc.data() as Record<string, unknown>;
        const passed = evaluateCondition(probe.expectedCondition, data);

        return {
          checkId: probe.id,
          policyId: '',
          probeId: probe.id,
          appTarget: probe.targetDb,
          status: passed ? 'green' : 'red',
          message: passed
            ? `✓ ${probe.name} — compliant`
            : `✗ ${probe.name} — condition failed: ${probe.expectedCondition}`,
          probeType: 'db_config',
          rawData: data,
          executedAt: now,
        };
      }

      // Manual or unsupported probe type
      return {
        checkId: probe.id,
        policyId: '',
        probeId: probe.id,
        appTarget: probe.targetDb,
        status: 'amber' as PolicyStatus,
        message: `Probe type '${probe.type}' requires manual verification`,
        probeType: probe.type,
        executedAt: now,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        checkId: probe.id,
        policyId: '',
        probeId: probe.id,
        appTarget: probe.targetDb,
        status: 'amber' as PolicyStatus,
        message: `Probe execution error: ${msg}`,
        probeType: probe.type,
        executedAt: now,
      };
    }
  },

  /** Run all registered probes and store results */
  async runAllProbes(): Promise<ScanResult[]> {
    const results = await Promise.all(
      PROBE_REGISTRY.map((probe) => this.executeProbe(probe))
    );

    // Store results in accreditationDb
    const batch = results.map((r) =>
      accreditationDb.collection('scan_results').add(r)
    );
    await Promise.allSettled(batch);

    await AuditService.log({
      action: 'suite_scan_completed',
      actor: 'system',
      targetType: 'scan',
      targetId: 'full_suite',
      details: {
        total: results.length,
        passed: results.filter((r) => r.status === 'green').length,
        failed: results.filter((r) => r.status === 'red').length,
      },
    });

    return results;
  },
};
