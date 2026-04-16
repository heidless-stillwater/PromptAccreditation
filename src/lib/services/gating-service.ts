import { AccreditationTier } from '../types';

/**
 * STRIPE-ALIGNED PERMISSION GATING
 * Handles feature access based on the user's subscription tier.
 */
export const GatingService = {
  /**
   * Check if a tier has access to a specific feature ID.
   */
  hasFeature(tier: AccreditationTier, featureId: 'active_monitoring' | 'active_fix' | 'doc_drafting' | 'advanced_reporting'): boolean {
    const permissions: Record<AccreditationTier, string[]> = {
      free: ['doc_drafting'],
      professional: ['doc_drafting', 'advanced_reporting'],
      enterprise: ['doc_drafting', 'advanced_reporting', 'active_monitoring', 'active_fix']
    };

    return permissions[tier].includes(featureId);
  },

  /**
   * Get the required tier for a specific feature.
   */
  getRequiredTier(featureId: string): AccreditationTier {
    if (['active_monitoring', 'active_fix'].includes(featureId)) return 'enterprise';
    if (featureId === 'advanced_reporting') return 'professional';
    return 'free';
  }
};
