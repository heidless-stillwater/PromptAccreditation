import { PolicyService } from './policy-service';
import { ProbeService } from './probe-service';
import { TicketService } from './ticket-service';
import { accreditationDb } from '../firebase-admin';
import { ScanResult } from '../types';

export const MonitoringService = {
  /**
   * Run all probes across the suite, raise tickets for failures.
   */
  async scanForDrifts(): Promise<{ ticketsRaised: number; issuesDetected: string[] }> {
    console.log('[MonitoringService] 🚀 Starting suite-wide compliance scan...');
    const results = await ProbeService.runAllProbes();
    console.log(`[MonitoringService] Probes complete. Found ${results.length} results.`);
    const issuesDetected: string[] = [];
    let ticketsRaised = 0;

    for (const result of results) {
      console.log(`[MonitoringService] Processing probe: ${result.probeId} (${result.status})`);
      
      // PROBE -> POLICY MAPPING check
      const mapping = PROBE_TO_POLICY_MAP[result.probeId];
      console.log(`[MonitoringService] Probe: ${result.probeId} -> Mapping:`, mapping);
      if (mapping) {
        console.log(`[MonitoringService] Syncing policy ${mapping.policySlug} check ${result.checkId}...`);
        try {
          await PolicyService.updateCheckStatus(
            mapping.policyId,
            result.checkId,
            result.status,
            undefined,
            'system_monitor'
          );
          console.log('[MonitoringService] ✅ Policy sync successful.');
        } catch (e) {
          console.error(`[MonitoringService] ❌ Policy sync failed for ${result.checkId}:`, e);
          throw e; // Propagate to trigger the action catch
        }
      }

      if (result.status === 'red') {
        issuesDetected.push(result.message);

        if (!mapping) {
          console.log(`[MonitoringService] ⚠️ No mapping found for failed probe ${result.probeId}`);
          continue;
        }

        console.log(`[MonitoringService] Raising ticket for ${result.probeId}...`);
        try {
          const ticketId = await TicketService.raiseIfNotDuplicate({
            policyId: mapping.policyId,
            policySlug: mapping.policySlug,
            checkId: result.checkId,
            status: 'open',
            priority: mapping.priority,
            severity: mapping.severity,
            type: 'drift_detected',
            title: `Drift Detected: ${result.message.replace('✗ ', '')}`,
            description: `Automated scan detected non-compliance.\n\nProbe: ${result.probeId}\nTarget: ${result.appTarget}\nCondition failed: See probe definition.`,
            affectedApps: [result.appTarget],
            remediation: {
              type: mapping.fixId ? 'active_fix' : 'guided_manual',
              fixId: mapping.fixId,
            },
            timeline: [],
          });

          if (ticketId) {
            console.log(`[MonitoringService] 🎫 Ticket created/updated: ${ticketId}`);
            ticketsRaised++;
          } else {
            console.log('[MonitoringService] ⏭️ Ticket is duplicate, skipped.');
          }
        } catch (e) {
          console.error(`[MonitoringService] ❌ Ticket creation failed for ${result.checkId}:`, e);
          throw e;
        }
      }
    }

    console.log(
      `[MonitoringService] ✨ Scan complete. Issues: ${issuesDetected.length}, Tickets raised: ${ticketsRaised}`
    );
    return { ticketsRaised, issuesDetected };
  },

  /**
   * Get the most recent scan results.
   */
  async getRecentScanResults(limit = 20): Promise<ScanResult[]> {
    const snap = await accreditationDb
      .collection('scan_results')
      .orderBy('executedAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as ScanResult);
  },
};

// ═══════════════════════════════════════════════════════
// PROBE → POLICY MAPPING
// Maps probe IDs to the policy/check context for ticket creation
// ═══════════════════════════════════════════════════════
const PROBE_TO_POLICY_MAP: Record<
  string,
  {
    policyId: string;
    policySlug: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    severity: 'blocker' | 'major' | 'minor' | 'cosmetic';
    fixId?: string;
  }
> = {
  'probe-av-gateway': {
    policyId: 'online-safety-act',
    policySlug: 'online-safety-act',
    priority: 'critical',
    severity: 'blocker',
    fixId: 'av_gateway_fix',
  },
  'probe-content-moderation': {
    policyId: 'online-safety-act',
    policySlug: 'online-safety-act',
    priority: 'high',
    severity: 'major',
    fixId: 'moderation_baseline_fix',
  },
  'probe-encryption-enforcement': {
    policyId: 'data-protection-act',
    policySlug: 'data-protection-act',
    priority: 'critical',
    severity: 'blocker',
    fixId: 'fix-encryption',
  },
  'probe-data-audit': {
    policyId: 'data-protection-act',
    policySlug: 'data-protection-act',
    priority: 'high',
    severity: 'major',
    fixId: 'fix-data-audit',
  },
  'probe-security-headers': {
    policyId: 'site-security',
    policySlug: 'site-security',
    priority: 'high',
    severity: 'major',
    fixId: 'fix-security-headers',
  },
};
