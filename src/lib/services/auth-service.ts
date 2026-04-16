import { AccreditationUser } from '../types';
import { getSessionUser } from '../auth';

/**
 * AUTH SERVICE BRIDGE
 * Interfaces with the cross-app session management system.
 */
export const AuthService = {
  async getCurrentUser(): Promise<AccreditationUser | null> {
    const user = await getSessionUser();
    
    // Sovereign Fallback: Local Development Support
    if (!user && process.env.NODE_ENV === 'development') {
      return {
        uid: 'local-user',
        email: 'dev@stillwater.io',
        displayName: 'Sovereign Developer',
        isAdmin: true,
        tier: 'enterprise'
      };
    }
    
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAdmin: user.isAdmin,
      tier: user.tier as any,
    };
  }
};
