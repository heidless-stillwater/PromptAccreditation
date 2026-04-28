import { globalDb, withTimeout } from '../firebase-admin';
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

export const EntitlementService = {
  /**
   * Resolves the user's Accreditation product tier from the global identity store.
   * Admin/SU users always receive 'enterprise'.
   */
  async getAccreditationTier(uid: string): Promise<AccreditationTier> {
    try {
      const { accreditationDb } = await import('../firebase-admin');
      const userDoc = await withTimeout(accreditationDb.collection('users').doc(uid).get());
      if (!userDoc.exists) return 'free';
      const data = userDoc.data()!;

      // 1. Admin/SU Authority
      if (data.role === 'admin' || data.role === 'su' || data.isAdmin === true) return 'enterprise';

      // 2. Direct Root-Level Tier (PromptTool Standard)
      const rootTier = data.tier || data.subscriptionType || data.subscription;
      if (rootTier === 'enterprise') return 'enterprise';
      if (rootTier === 'professional' || rootTier === 'pro') return 'professional';

      // 3. Suite Subscription Mapping
      const subscriptionObj = data.suiteSubscription || data.subscriptionMetadata;
      if (subscriptionObj) {
        const tier = subscriptionObj.tier;
        if (tier === 'enterprise') return 'enterprise';
        if (tier === 'professional' || tier === 'pro') return 'professional';

        const activeSuites: string[] = subscriptionObj.activeSuites || [];
        if (activeSuites.includes('accreditation-enterprise')) return 'enterprise';
        if (activeSuites.includes('accreditation-professional')) return 'professional';
        if (activeSuites.includes('accreditation')) return 'professional';
      }

      return 'free';
    } catch (err) {
      console.error('[Entitlements] Failed to resolve tier:', err);
      return 'free';
    }
  },

  /** Check if a feature is unlocked for a given tier */
  hasFeature(
    tier: AccreditationTier,
    feature: keyof (typeof TIER_FEATURES)['free']
  ): boolean {
    return TIER_FEATURES[tier][feature] as boolean;
  },

  /** Get readable plan label */
  getTierLabel(tier: AccreditationTier): string {
    const tierLabels: Record<string, string> = {
      free: 'Community',
      professional: 'Pro',
      pro: 'Pro',
      enterprise: 'Pro'
    };
    return tierLabels[tier];
  },

  async getUserData(uid: string) {
    const doc = await withTimeout(globalDb.collection('users').doc(uid).get());
    if (!doc.exists) return null;
    
    const data = doc.data()!;
    const tier = await this.getAccreditationTier(uid);
    
    return {
      uid,
      email: data.email || '',
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      isAdmin: data.isAdmin || false,
      tier,
      // We explicitly omit raw 'subscription' or 'subscriptionMetadata' to prevent React render crashes
    };
  }
};
