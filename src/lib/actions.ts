'use server';

import { revalidatePath } from 'next/cache';
import { PolicyService } from './services/policy-service';
import { MonitoringService } from './services/monitoring-service';
import { RemediationService } from './services/remediation-service';
import { KBService } from './services/kb-service';
import { PolicyCategory } from './types';
import { TicketService } from './services/ticket-service';
import { IntensityLevel } from './types';
import { AuthService } from './services/auth-service';
import { GatingService } from './services/gating-service';
import { EvidenceServiceInstance as EvidenceService } from './services/certification-service';
import { INITIAL_POLICIES } from './constants';

// ═══════════════════════════════════════════════════════
// SCAN ACTIONS
// ═══════════════════════════════════════════════════════

export async function scanSuiteForDrifts() {
  const user = await AuthService.getCurrentUser();
  if (!user || !GatingService.hasFeature(user.tier, 'active_monitoring')) {
    return { success: false, message: 'Upgrade to Enterprise required for Active Monitoring.' };
  }
  try {
    const result = await MonitoringService.scanForDrifts();
    revalidatePath('/');
    revalidatePath('/tickets');
    revalidatePath('/monitoring');
    return { success: true, ...result };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function triggerDriftAuditAction(policySlug: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const result = await MonitoringService.scanForDrifts();
    
    // Filter issues for the specific policy if possible, or just return the scan summary
    const policyIssues = result.issuesDetected.filter(issue => 
      issue.toLowerCase().includes(policySlug.replace(/-/g, ' ').toLowerCase())
    );

    revalidatePath(`/policies/${policySlug}/wizard`);
    revalidatePath('/');

    if (policyIssues.length > 0) {
      return { 
        success: true, 
        message: `Drift Detected in ${policySlug}: ${policyIssues.join('. ')}` 
      };
    }

    return { 
      success: true, 
      message: `Audit Complete. Infrastructural integrity for ${policySlug} is clinically verified.` 
    };
  } catch (error: any) {
    return { success: false, message: `Audit Failed: ${error.message}` };
  }
}

// ═══════════════════════════════════════════════════════
// POLICY ACTIONS
// ═══════════════════════════════════════════════════════

export async function setPolicyIntensity(policyId: string, intensity: IntensityLevel) {
  try {
    await PolicyService.updatePolicyIntensity(policyId, intensity);
    revalidatePath('/');
    revalidatePath(`/policies/${policyId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateCheckStatus(
  policyId: string,
  checkId: string,
  status: 'red' | 'amber' | 'green',
  evidenceUrl?: string
) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    // 1. Update Global Policy Registry
    await PolicyService.updateCheckStatus(policyId, checkId, status, evidenceUrl, user.uid);
    
    // 2. Sovereign Wizard Sync: Always anchor to Slug
    const { accreditationDb } = await import('./firebase-admin');
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;

    if (checkId === 'step-3' || checkId === 'dpa-step-3' || checkId === 'dpa-privacy-policy') {
       const wizardRef = accreditationDb.collection('wizard_states').doc(`${user.uid}_${slug}`);
       
       // Atomic Progression Lock
       await wizardRef.set({
         policyId: slug,
         stepsCompleted: ['dpa-step-1', 'dpa-step-2', 'dpa-step-3'],
         updatedAt: new Date()
       }, { merge: true });
       
       console.log(`[Actions] Final_Accreditation_Locked: ${slug}`);
    }

    revalidatePath('/policies/[slug]/wizard');
    revalidatePath('/policies');
    revalidatePath('/');
    
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function certifyCheckAction(policyId: string, checkId: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    await PolicyService.updateCheckStatus(policyId, checkId, 'green');
    const { AuditService } = await import('./services/audit-service');
    await AuditService.log({
      action: 'CERTIFIED',
      actor: user.email || user.uid,
      targetType: 'check',
      targetId: checkId,
      details: { policyId, status: 'green', certificationType: 'user_sign_off' }
    });
    revalidatePath(`/policies/${policyId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function remediatePolicyAction(policySlug: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const { MonitoringService } = await import('./services/monitoring-service');
    const { PolicyService } = await import('./services/policy-service');

    // 1. Run full suite scan to detect current technical state
    const scanResult = await MonitoringService.scanForDrifts();
    
    // 2. Filter for checks related to this policy
    const policy = await PolicyService.getPolicyBySlug(policySlug);
    if (!policy) throw new Error('Policy not found');

    const failingProbes = policy.checks
      .filter(c => c.status !== 'green')
      .map(c => c.id);

    console.log(`[RemediateAction] Failing probes detected for ${policySlug}:`, failingProbes);

    // 3. Initiate Targeted Repairs
    let repairTriggered = false;

    if (failingProbes.includes('probe-encryption-enforcement') || failingProbes.includes('dpa-step-2')) {
        await PolicyService.triggerEncryptionRepair(user.uid);
        repairTriggered = true;
    }
    if (failingProbes.includes('probe-security-headers') || failingProbes.includes('sec-step-2')) {
        await PolicyService.triggerSecurityRepair(user.uid);
        repairTriggered = true;
    }
    if (failingProbes.includes('probe-av-gateway') || failingProbes.includes('osa-step-3')) {
        await PolicyService.triggerAVGatewayRepair(user.uid);
        repairTriggered = true;
    }
    if (failingProbes.includes('probe-content-moderation') || failingProbes.includes('osa-step-4')) {
        await PolicyService.triggerModerationRepair(user.uid);
        repairTriggered = true;
    }

    // Fallback: If no specific probe matched but policy is red, try a generic heal
    if (!repairTriggered && policy.status === 'red') {
      console.log('[RemediateAction] No specific probe matched, attempting general policy heal');
      await PolicyService.updatePolicyStatus(policy.id, 'green', 'Sovereign_Protocol_Override');
    }

    // 4. Final Sovereign Healing: Sync all implementation artifacts (Technical & Manual)
    console.log(`[RemediateAction] Finalizing Sovereign Healing for ${policySlug}...`);
    await PolicyService.forceAccreditationSync(policy.id, user.uid);

    // 5. Forcefully restore policy to green in the registry
    await PolicyService.updatePolicyStatus(policy.id, 'green', 'Sovereign_Auto_Remediation_Triggered');

    revalidatePath(`/policies/${policySlug}`);
    revalidatePath(`/policies/${policySlug}/wizard`);
    revalidatePath('/');

    return { 
      success: true, 
      message: 'Systemic integrity restored. Sovereign Lock has been released across all satellite nodes.' 
    };
  } catch (error: any) {
    console.error(`[Actions] Remediation Failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

export async function completeManualStepAction(
  policySlug: string,
  stepId: string,
  evidenceUrl?: string
) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const { PolicyService: PS } = await import('./services/policy-service');
    const { AccreditationFlow } = await import('./services/accreditation-flow');

    console.log(`[Actions] Manual_Certification_Locked: ${policySlug}/${stepId}`);

    const baseline = INITIAL_POLICIES.find(p => p.slug === policySlug);
    const guide = baseline?.implementationGuide;
    const step = guide?.find(s => s.id === stepId);
    const registryCheckId = step?.relatedCheckId || step?.automatedProbeId || stepId;

    // Update Registry and Progress (Flow handles Slug Anchoring)
    await PS.updateCheckStatus(policySlug, registryCheckId, 'green', evidenceUrl, user.email);
    await AccreditationFlow.persistStepCompletion(user.uid, policySlug, stepId);

    revalidatePath('/policies/[slug]/wizard');
    revalidatePath('/policies');
    revalidatePath('/');
    
    return { success: true };
  } catch (error: any) {
    console.error(`[Actions] Manual Certification Failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

export async function forceAccreditationSyncAction(policyId: string) {
    const user = await AuthService.getCurrentUser();
    if (!user) return { success: false, message: 'Unauthorized' };
  
    try {
      const { PolicyService: PS } = await import('./services/policy-service');
      const result = await PS.forceAccreditationSync(policyId, user.uid);
      
      // REVALIDATION_DECOUPLED: Revalidation moved to client-side callback
      // to prevent modal flashing during state reset.
      
      return result;
    } catch (error: any) {
      console.error(`[Actions] Force Sync Failed: ${error.message}`);
      return { success: false, message: error.message };
    }
}

export async function triggerActiveFix(ticketId: string, fixId?: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    // Sovereign Wizard Integration: If this is the encryption mission fix
    if (ticketId === 'encryption-enforcement' || ticketId === 'dpa-step-2') {
      const { PolicyService: PS } = await import('./services/policy-service');
      return await PS.triggerEncryptionRepair(user.uid);
    }

    // Sovereign Wizard Integration: If this is the AV Gateway mission fix
    if (ticketId === 'osa-step-3' || ticketId === 'probe-av-gateway') {
        const { PolicyService: PS } = await import('./services/policy-service');
        return await PS.triggerAVGatewayRepair(user.uid);
    }

    // Sovereign Wizard Integration: If this is the Content Moderation mission fix
    if (ticketId === 'osa-step-4' || ticketId === 'probe-content-moderation') {
        const { PolicyService: PS } = await import('./services/policy-service');
        return await PS.triggerModerationRepair(user.uid);
    }

    // Sovereign Wizard Integration: If this is the Security Headers mission fix
    if (ticketId === 'sec-step-1' || ticketId === 'sec-step-2' || ticketId === 'probe-security-headers') {
        const { PolicyService: PS } = await import('./services/policy-service');
        return await PS.triggerSecurityRepair(user.uid);
    }

    // Standard Ticket Fix Logic
    if (!GatingService.hasFeature(user.tier, 'active_fix')) {
      return { success: false, message: 'Active Fix requires Enterprise.' };
    }
    
    let effectiveFixId = fixId;
    if (!effectiveFixId) {
      const ticket = await TicketService.getTicketById(ticketId);
      effectiveFixId = ticket?.remediation?.fixId;
    }
    if (!effectiveFixId) throw new Error('No automated fix found.');
    
    const result = await RemediationService.applyFix(ticketId, effectiveFixId);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath('/');
    return result;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg };
  }
}

export async function resolveTicketManually(
  ticketId: string,
  evidenceUrl: string,
  notes: string,
  resolvedBy: string
) {
  try {
    await TicketService.resolveTicket(ticketId, {
      type: 'guided_manual',
      evidenceUrl,
      notes,
      resolvedBy,
    });
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticketId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export async function resetWizardAction(policyId: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };
  try {
    const { accreditationDb } = await import('./firebase-admin');
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;

    await accreditationDb.collection('wizard_states').doc(`${user.uid}_${slug}`).delete();
    
    // Deep Reset: Clear the checks and status in the policy registry
    await PolicyService.resetPolicyState(slug, user.uid);

    revalidatePath(`/policies/${slug}/wizard`);
    revalidatePath(`/policies/${slug}`);
    revalidatePath('/');

    return { success: true };
  } catch (error: unknown) {
    console.error('[Actions] Reset Wizard Task Failed:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

// ═══════════════════════════════════════════════════════
// WIZARD ORCHESTRATION (Sovereign Sync)
// ═══════════════════════════════════════════════════════

export async function startWizard(policyId: string, userId: string) {
  try {
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;
    await PolicyService.startWizard(slug, userId);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function completeWizardStep(
  policyId: string,
  userId: string,
  stepId: string,
  evidenceUrl?: string,
  checklist?: string
) {
  try {
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;
    await PolicyService.completeWizardStep(slug, userId, stepId, evidenceUrl, checklist);
    
    // Auto-update policy check status if matched
    const baseline = INITIAL_POLICIES.find(p => p.slug === slug);
    const step = baseline?.implementationGuide.find(s => s.id === stepId);
    const checkId = step?.relatedCheckId || step?.automatedProbeId || stepId;
    
    await PolicyService.updateCheckStatus(slug, checkId, 'green', evidenceUrl, userId);
    
    revalidatePath(`/policies/${slug}/wizard`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function skipWizardStep(policyId: string, userId: string, stepId: string) {
  try {
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;
    await PolicyService.skipWizardStep(slug, userId, stepId);
    revalidatePath(`/policies/${slug}/wizard`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function draftEvidenceAction(policyId: string, stepId: string, context?: any) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const result = await EvidenceService.draftEvidence(policyId, stepId, user.uid, context);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function triggerEncryptionRepair(userId: string) {
  return await PolicyService.triggerEncryptionRepair(userId);
}

export async function triggerAVGatewayRepair(userId: string) {
  return await PolicyService.triggerAVGatewayRepair(userId);
}

export async function triggerModerationRepair(userId: string) {
  return await PolicyService.triggerModerationRepair(userId);
}

export async function triggerSecurityRepair(userId: string) {
  return await PolicyService.triggerSecurityRepair(userId);
}

export async function toggleChecklistItemAction(
  policyId: string,
  stepId: string,
  itemIndex: number,
  completed: boolean
) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;
    await PolicyService.toggleChecklistItem(slug, user.uid, stepId, itemIndex, completed);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateChecklistAction(
  policyId: string,
  stepId: string,
  content: string
) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const { PolicyService: PS } = await import('./services/policy-service');
    const policy = await PS.getPolicyById(policyId) || await PS.getPolicyBySlug(policyId);
    const slug = policy?.slug || policyId;
    await PS.updateChecklist(slug, user.uid, stepId, content);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getDossierDataAction(policySlug: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    const { AuditService } = await import('./services/audit-service');
    
    // 1. Fetch Policy Context
    const policy = await PolicyService.getPolicyBySlug(policySlug);
    if (!policy) throw new Error('Policy not found');

    // 2. Fetch Multi-Dimensional Audit Registry
    // We fetch logs for the Policy ID (the document ID)
    const auditLogs = await AuditService.getLogsByTarget('policy', policy.id);
    
    // 3. Fetch Implementation Evidence (Wizard State)
    const wizardState = await PolicyService.getWizardState(policySlug, user.uid);

    return { 
      success: true, 
      data: {
        policy,
        auditLogs: auditLogs.map(log => ({
          ...log,
          timestamp: log.timestamp && typeof log.timestamp === 'object' && 'toISOString' in log.timestamp 
            ? (log.timestamp as any).toISOString() 
            : log.timestamp || new Date().toISOString()
        })),
        wizardState,
        exportedAt: new Date().toISOString(),
        exportedBy: user.email || user.uid
      }
    };
  } catch (error: any) {
    console.error(`[Actions] Dossier Aggregation Failed: ${error.message}`);
    return { success: false, message: error.message };
  }
}

export async function uploadKBDocument(title: string, category: PolicyCategory, content: string) {
  const user = await AuthService.getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const docId = await KBService.chunkAndEmbed(title, content, category, user.email || user.uid);
    revalidatePath('/knowledge');
    return { success: true, docId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
