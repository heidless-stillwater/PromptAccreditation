import { globalDb } from '../firebase-admin';
import { AccreditationTier } from '../types';

export const TIER_FEATURES = {
  free: {
    maxPolicies: 1,
    activeRemediation: false,
    aiChat: false,
    customProbes: false,
    auditExport: false,
    suiteMonitoring: true,
  },
  professional: {
    maxPolicies: 5,
    activeRemediation: true,
    aiChat: true,
    customProbes: false,
    auditExport: true,
    suiteMonitoring: true,
  },
  enterprise: {
    maxPolicies: Infinity,
    activeRemediation: true,
    aiChat: true,
    customProbes: true,
    auditExport: true,
    suiteMonitoring: true,
  },
} as const;

/**
 * Resolves the user's Accreditation product tier from the global identity store.
 * Admin/SU users always receive 'enterprise'.
 */
export async function getAccreditationTier(uid: string): Promise<AccreditationTier> {
  try {
    const userDoc = await globalDb.collection('users').doc(uid).get();
    if (!userDoc.exists) return 'free';
    const data = userDoc.data()!;

    // Admins get enterprise
    if (data.role === 'admin' || data.role === 'su') return 'enterprise';

    // Check suite subscription
    const subscriptionObj =
      data.suiteSubscription ||
      data.subscriptionMetadata ||
      (typeof data.subscription === 'object' ? data.subscription : null);

    const activeSuites: string[] = subscriptionObj?.activeSuites || [];

    if (activeSuites.includes('accreditation-enterprise')) return 'enterprise';
    if (activeSuites.includes('accreditation-professional')) return 'professional';
    if (activeSuites.includes('accreditation')) return 'professional';

    return 'free';
  } catch (err) {
    console.error('[Entitlements] Failed to resolve tier:', err);
    return 'free';
  }
}

/** Check if a feature is unlocked for a given tier */
export function hasFeature(
  tier: AccreditationTier,
  feature: keyof (typeof TIER_FEATURES)['free']
): boolean {
  return TIER_FEATURES[tier][feature] as boolean;
}

/** Get readable plan label */
export function getTierLabel(tier: AccreditationTier): string {
  const labels: Record<AccreditationTier, string> = {
    free: 'Community',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return labels[tier];
}
