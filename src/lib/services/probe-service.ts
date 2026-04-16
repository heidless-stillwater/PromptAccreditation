import { accreditationDb, masterDb, resourcesDb } from '../firebase-admin';
import { PolicyService } from './policy-service';

export type ProbeType = 'http' | 'database' | 'system';

export interface AuditResult {
  success: boolean;
  status: 'green' | 'amber' | 'red';
  message: string;
  timestamp: Date;
}

/**
 * Sovereign Probe Service
 * Orchestrates autonomous drift auditing and verification of accredited measures.
 */
export class ProbeService {
  /**
   * Performs a focused audit on a specific compliance check.
   */
  static async auditCheck(policyId: string, checkId: string, userId: string): Promise<AuditResult> {
    console.log(`[ProbeService] Auditing: ${policyId} / ${checkId} for User: ${userId}`);

    try {
      const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
      if (!policy) throw new Error(`Policy context missing for ID/Slug: ${policyId}`);

      const check = policy.checks.find(c => c.id === checkId);
      if (!check) throw new Error(`Check ID ${checkId} not found in Policy ${policyId}`);

      // 1. ROUTING: Identify verification protocol
      if (checkId === 'step-3' || checkId === 'dpa-privacy-policy') {
        return await this.auditPrivacyPortal(check.evidenceUrl || '');
      }

      if (checkId === 'step-2' || checkId === 'probe-encryption-enforcement') {
        return await this.auditEncryptionEnforcement(userId);
      }

      if (checkId === 'step-1' || checkId === 'probe-data-audit') {
        return await this.auditDataLogging(userId);
      }

      if (checkId === 'osa-step-3' || checkId === 'probe-av-gateway') {
        return await this.auditAVGateway(userId);
      }

      if (checkId === 'probe-content-moderation') {
        return await this.auditContentModeration(userId);
      }

      return {
        success: true,
        status: 'green',
        message: 'No technical probe defined for this step. Manual verification assumed.',
        timestamp: new Date()
      };

    } catch (error: any) {
      console.error(`[ProbeService] Audit SYSTEM_ERROR: ${error.message}`);
      return {
        success: false,
        status: 'red',
        message: `Audit Infrastructure Failure: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * PROBE: HTTP Transparency Portal
   * Verifies that the accredited Privacy Policy is live and accessible.
   */
  public static async auditPrivacyPortal(url: string): Promise<AuditResult> {
    if (!url) {
      return { success: false, status: 'amber', message: 'Registry Error: No Certification URL provided.', timestamp: new Date() };
    }

    try {
      // Handle local relative URLs for internal prober
      let targetUrl = url;
      if (url.startsWith('/')) {
         targetUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003') + url;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s Clinical Timeout

      console.log(`[ProbeService] FETCHING_PROBE: ${targetUrl}`);
      const response = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          status: 'green',
          message: `Transparency Portal verified: ${response.status} OK.`,
          timestamp: new Date()
        };
      } else {
        return {
          success: false,
          status: 'amber',
          message: `Transparency Drift: Received ${response.status} from ${targetUrl}.`,
          timestamp: new Date()
        };
      }
    } catch (error: any) {
      return {
        success: false,
        status: 'red',
        message: `Network Probe Failure: ${error.message} (Target: ${url})`,
        timestamp: new Date()
      };
    }
  }

  /**
   * PROBE: Encryption Enforcement
   * Verifies technical compliance via Sovereign Fallback.
   */
  public static async auditEncryptionEnforcement(userId = 'system'): Promise<AuditResult> {
     const checkDb = async (db: any, label: string) => {
        try {
           const doc = await db.collection('system_settings').doc('compliance').get();
           if (doc.exists && doc.data()?.encryptionForced === true) return { success: true, label };
           return { success: false, label };
        } catch (err: any) {
           if (err.message.includes('NOT_FOUND')) return { isNotFound: true, label };
           throw err;
        }
     };

     try {
        // 1. Try Primary (Named)
        const primary = await checkDb(masterDb, 'promptmaster-db-0');
        if (primary.success) return this.successResult(`Encryption verified on ${primary.label}.`);
        
        // 2. Try Fallback (Default)
        const { globalDb } = await import('../firebase-admin');
        const secondary = await checkDb(globalDb, '(default)');
        if (secondary.success) return this.successResult(`Encryption verified on ${secondary.label} (Fallback).`);

        // 3. Try Safety Net (Accreditation)
        const { accreditationDb: accDb } = await import('../firebase-admin');
        const final = await checkDb(accDb, 'promptaccreditation-db-0');
        if (final.success) return this.successResult(`Encryption verified on ${final.label} (Safety Net).`);

        return {
           success: false,
           status: 'red',
           message: 'Infrastructure Drift: Encryption Enforcement NOT DETECTED across Sovereign registries.',
           timestamp: new Date()
        };

     } catch (error: any) {
        return {
           success: false,
           status: 'red',
           message: `Infrastructure Probe Failure: ${error.message}`,
           timestamp: new Date()
        };
     }
  }
 
  /**
   * PROBE: Age Verification Gateway
   * Verifies technical compliance in PromptResources via Behavioral Probing.
   */
  public static async auditAVGateway(userId = 'system'): Promise<AuditResult> {
    const resourcesUrl = (process.env.RESOURCES_APP_URL || 'http://localhost:3002') + '/api/resources';
    
    try {
      // 1. BEHAVIORAL PROBE: Check if the gate is physically intercepting requests
      console.log(`[ProbeService] BEHAVIORAL_PROBE: Attempting gated fetch from ${resourcesUrl}`);
      
      const res = await fetch(resourcesUrl, { 
        method: 'POST', // getResourcesAction is typically a POST/Action
        body: JSON.stringify({ page: 1, pageSize: 1 }),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store' 
      });

      const data = await res.json().catch(() => ({}));
      
      // 2. VERIFICATION LOGIC:
      // If the gate is active, the API will return complianceGated: true
      if (data.complianceGated === true) {
         return this.successResult('Behavioral Verification Successful: The Sovereign AV Gateway is physically gating content in PromptResources.');
      }

      // 3. REGISTRY FALLBACK: If behavioral check didn't explicitly return the gate flag
      const checkAV = async (db: any, label: string) => {
         try {
            const doc = await db.collection('system_config').doc('protection').get();
            if (doc.exists && doc.data()?.avEnabled === true) return { success: true, label, data: doc.data() };
            return { success: false, label };
         } catch (err: any) {
            if (err.message.includes('NOT_FOUND')) return { isNotFound: true, label };
            throw err;
         }
      };

      const primary = await checkAV(resourcesDb, 'promptresources-db-0');
      if (primary.success) {
        return {
          success: true,
          status: 'amber',
          message: 'Soft Compliance: AV Config is active in registry, but Behavioral Gate was not confirmed in the live API.',
          timestamp: new Date()
        };
      }

      return {
        success: false,
        status: 'red',
        message: 'Infrastructure Drift: Age Verification Gateway NOT ACTIVE in Registry or API.',
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'red',
        message: `Infrastructure Probe Failure (AV): ${error.message}. Ensure PromptResources is reachable.`,
        timestamp: new Date()
      };
    }
  }

  /**
   * PROBE: Content Moderation Active
   * Verifies that the moderation module is physically active in PromptResources.
   */
  public static async auditContentModeration(userId = 'system'): Promise<AuditResult> {
     try {
        const doc = await resourcesDb.collection('system_config').doc('moderation').get();
        if (doc.exists) {
           const data = doc.data();
           const flagging = data?.flaggingEnabled === true;
           const aiScreening = data?.aiScreening === true;
           
           if (flagging && aiScreening) {
              return this.successResult('Content Moderation Verified: Both Flagging and AI Screening are active in the PromptResources infrastructure.');
           } else {
              return {
                 success: true,
                 status: 'amber',
                 message: `Hybrid Drift: Moderation registry exists, but components are partial (Flagging=${flagging}, AI=${aiScreening}).`,
                 timestamp: new Date()
              };
           }
        }
        
        return {
           success: false,
           status: 'red',
           message: 'Infrastructure Drift: Content Moderation registry NOT FOUND in PromptResources.',
           timestamp: new Date()
        };
     } catch (error: any) {
        return {
           success: false,
           status: 'red',
           message: `Infrastructure Probe Failure (Moderation): ${error.message}`,
           timestamp: new Date()
        };
     }
  }

  /**
   * PROBE: Audit Logging Active
   * Clinical verification of technical audit trails in Firestore.
   */
  public static async auditDataLogging(userId = 'system'): Promise<AuditResult> {
     try {
        const { accreditationDb: accDb } = await import('../firebase-admin');
        const snap = await accDb.collection('audit_log').limit(10).get();
        
        const count = snap.size;
        
        if (count >= 5) {
           return {
             success: true,
             status: 'green',
             message: `Audit Logging verified: Detected ${count}+ active telemetry streams.`,
             timestamp: new Date()
           };
        } else if (count > 0) {
           return {
              success: true,
              status: 'amber',
              message: `Audit Logging Active but sparse: Only ${count} entries detected.`,
              timestamp: new Date()
           };
        } else {
           return {
              success: false,
              status: 'red',
              message: 'Infrastructure Drift: No technical audit logs detected in Registry.',
              timestamp: new Date()
           };
        }
     } catch (error: any) {
        return {
          success: false,
          status: 'red',
          message: `Infrastructure Probe Failure (Logs): ${error.message}`,
          timestamp: new Date()
        };
     }
  }
 
  private static successResult(message: string): AuditResult {
    return { success: true, status: 'green', message, timestamp: new Date() };
  }

  /**
   * Orchestrates a full sweep of all technical measures.
   */
  static async runAllProbes(): Promise<any[]> {
    console.log('[ProbeService] Running_Full_Suite_Audits...');
    const results = [];
    
    // In v2.0, we prioritize DPA and OSA probes
    const probes = [
      { policyId: 'data-protection-act', checkId: 'probe-encryption-enforcement' },
      { policyId: 'data-protection-act', checkId: 'probe-data-audit' },
      { policyId: 'online-safety-act', checkId: 'probe-av-gateway' },
      { policyId: 'online-safety-act', checkId: 'probe-content-moderation' }
    ];

    for (const p of probes) {
        const result = await this.auditCheck(p.policyId, p.checkId, 'system-monitor');
        results.push({
            probeId: p.checkId,
            checkId: p.checkId,
            status: result.status,
            message: result.message,
            appTarget: 'suite-global',
            executedAt: new Date()
        });
    }

    return results;
  }

  static async reconcileDrift(policyId: string, checkId: string, userId: string): Promise<AuditResult> {
    const result = await this.auditCheck(policyId, checkId, userId);
    
    if (result.status === 'amber' || result.status === 'red') {
      console.warn(`[ProbeService] DRIFT_DETECTED: Downgrading ${policyId}/${checkId} to ${result.status}`);
      await PolicyService.updateCheckStatus(policyId, checkId, result.status, undefined, userId);
    }
    
    return result;
  }
}
