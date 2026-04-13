'use server';

import { revalidatePath } from 'next/cache';
import { PolicyService } from './services/policy-service';
import { MonitoringService } from './services/monitoring-service';

/**
 * Server Action to trigger the Active Fix remediation workflow.
 */
export async function triggerActiveFix(ticketId: string) {
  try {
    const result = await PolicyService.activeFix(ticketId);
    
    // Revalidate paths to reflect updated status
    revalidatePath('/');
    revalidatePath('/tickets');
    
    return result;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Server Action to update the 'Intensity' dial of a policy.
 */
export async function setPolicyIntensity(policyId: string, intensity: 'soft' | 'hard' | 'systemic') {
  try {
    await PolicyService.updatePolicyIntensity(policyId, intensity);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Server Action for manual compliance resolution.
 */
export async function resolveTicketManually(ticketId: string, evidenceUrl: string, notes: string) {
  try {
    await PolicyService.resolveTicketWithEvidence(ticketId, evidenceUrl, notes);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${ticketId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Server Action to manually trigger a suite-wide compliance scan.
 */
export async function scanSuiteForDrifts() {
  try {
    const result = await MonitoringService.scanForDrifts();
    revalidatePath('/');
    revalidatePath('/tickets');
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
