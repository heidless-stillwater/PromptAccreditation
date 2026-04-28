import { masterDb, resourcesDb } from '../firebase-admin';
import { AuditService } from './audit-service';

export interface EnforcementResult {
  success: boolean;
  message: string;
  targetPath: string;
  details?: any;
}

/**
 * Sovereign Technical Enforcer
 * Central Command for cross-app infrastructure hardening.
 * Unifies the 'Active Fix' logic for all regulatory missions.
 */
export const TechnicalEnforcer = {
  /**
   * Enforces the Master Encryption Policy.
   * Path: masterDb -> system_settings/compliance
   */
  async enforceEncryption(actor = 'system'): Promise<EnforcementResult> {
    console.log(`[TechnicalEnforcer] Executing_Encryption_Hardening (Actor: ${actor})`);
    
    const tryEnforce = async (db: any, dbLabel: string) => {
      try {
        await db.collection('system_settings').doc('compliance').set({
          encryptionForced: true,
          lastHardened: new Date(),
          method: 'AES-256-GCM',
          hardenedBy: actor
        }, { merge: true });
        return { success: true, label: dbLabel };
      } catch (err: any) {
         if (err.message.includes('NOT_FOUND')) {
            console.warn(`[TechnicalEnforcer] Named database '${dbLabel}' not found. Skipping...`);
            return { success: false, label: dbLabel, isNotFound: true };
         }
         throw err;
      }
    };

    try {
      // 1. Primary Target: Sovereign Named Database
      const primary = await tryEnforce(masterDb, 'promptmaster-db-0');
      if (primary.success && primary.label) return { success: true, message: `Master Encryption Enforced on ${primary.label}.`, targetPath: primary.label };

      // 2. Safety Net: Accreditation DB
      const { accreditationDb } = await import('../firebase-admin');
      const final = await tryEnforce(accreditationDb, 'promptaccreditation-db-0');
      if (final.success && final.label) return { success: true, message: `Master Encryption Enforced on ${final.label} (Clinical Safety Net).`, targetPath: final.label };

      return { success: false, message: 'Could not locate a valid database for enforcement.', targetPath: 'ALL_INSTANCES' };

    } catch (err: any) {
      console.error(`[TechnicalEnforcer] Enforcement SYSTEM_ERROR: ${err.message}`);
      return { success: false, message: `Critical Infrastructure Lock Failure: ${err.message}`, targetPath: 'UNKNOWN' };
    }
  },

  /**
   * Enforces the AV Gateway Policy.
   * Path: resourcesDb -> system_config/protection
   */
  async enforceAVGateway(actor = 'system'): Promise<EnforcementResult> {
    console.log(`[TechnicalEnforcer] Executing_AV_Gateway_Hardening (Actor: ${actor})`);
    
    const tryEnforceAV = async (db: any, dbLabel: string) => {
      try {
        await db.collection('system_config').doc('protection').set({
          avEnabled: true,
          avStrictness: 'hard',
          lastEnforcedBy: actor,
          enforcedAt: new Date()
        }, { merge: true });
        return { success: true, label: dbLabel };
      } catch (err: any) {
         if (err.message.includes('NOT_FOUND')) {
            console.warn(`[TechnicalEnforcer] Named database '${dbLabel}' not found for AV. Skipping...`);
            return { success: false, label: dbLabel, isNotFound: true };
         }
         throw err;
      }
    };

    try {
      // 1. Primary Target: Resources Named Database
      const primary = await tryEnforceAV(resourcesDb, 'promptresources-db-0');
      if (primary.success && primary.label) return { success: true, message: `AV Gateway Enforced on ${primary.label}.`, targetPath: primary.label };

      // 2. Safety Net: Accreditation DB
      const { accreditationDb } = await import('../firebase-admin');
      const final = await tryEnforceAV(accreditationDb, 'promptaccreditation-db-0');
      if (final.success && final.label) return { success: true, message: `AV Gateway Enforced on ${final.label} (Clinical Safety Net).`, targetPath: final.label };

      return { success: false, message: 'Could not locate a valid database for AV enforcement.', targetPath: 'ALL_INSTANCES' };

    } catch (error: any) {
      console.error(`[TechnicalEnforcer] ENFORCEMENT_FAILURE (AV): ${error.message}`);
      return {
        success: false,
        message: `Infrastructure Lock Failed: ${error.message}`,
        targetPath: 'UNKNOWN'
      };
    }
  },
  
  /**
   * Enforces the Content Moderation Policy.
   * Path: resourcesDb -> system_config/moderation
   */
  async enforceModeration(actor = 'system'): Promise<EnforcementResult> {
    console.log(`[TechnicalEnforcer] Executing_Moderation_Hardening (Actor: ${actor})`);
    
    const tryEnforceMod = async (db: any, dbLabel: string) => {
      try {
        await db.collection('system_config').doc('moderation').set({
          flaggingEnabled: true,
          aiScreening: true,
          lastEnforcedBy: actor,
          enforcedAt: new Date()
        }, { merge: true });
        return { success: true, label: dbLabel };
      } catch (err: any) {
         if (err.message.includes('NOT_FOUND')) {
            console.warn(`[TechnicalEnforcer] Named database '${dbLabel}' not found for Moderation. Skipping...`);
            return { success: false, label: dbLabel, isNotFound: true };
         }
         throw err;
      }
    };

    try {
      // 1. Primary Target: Resources Named Database
      const primary = await tryEnforceMod(resourcesDb, 'promptresources-db-0');
      if (primary.success && primary.label) return { success: true, message: `Moderation Enforced on ${primary.label}.`, targetPath: primary.label };

      // 2. Safety Net: Accreditation DB
      const { accreditationDb } = await import('../firebase-admin');
      const final = await tryEnforceMod(accreditationDb, 'promptaccreditation-db-0');
      if (final.success && final.label) return { success: true, message: `Moderation Enforced on ${final.label} (Clinical Safety Net).`, targetPath: final.label };

      return { success: false, message: 'Could not locate a valid database for Moderation enforcement.', targetPath: 'ALL_INSTANCES' };

    } catch (error: any) {
      console.error(`[TechnicalEnforcer] ENFORCEMENT_FAILURE (Mod): ${error.message}`);
      return {
        success: false,
        message: `Infrastructure Lock Failed: ${error.message}`,
        targetPath: 'UNKNOWN'
      };
    }
  },
  
  /**
   * Enforces the Security Headers Policy.
   * Path: resourcesDb -> system_config/security
   */
  async enforceSecurityHeaders(actor = 'system'): Promise<EnforcementResult> {
    console.log(`[TechnicalEnforcer] Executing_Security_Hardening (Actor: ${actor})`);
    
    const tryEnforceSec = async (db: any, dbLabel: string) => {
      try {
        await db.collection('system_config').doc('security').set({
          securityHeadersEnabled: true,
          hstsEnabled: true,
          lastEnforcedBy: actor,
          enforcedAt: new Date()
        }, { merge: true });
        return { success: true, label: dbLabel };
      } catch (err: any) {
         if (err.message.includes('NOT_FOUND')) {
            return { success: false, label: dbLabel, isNotFound: true };
         }
         throw err;
      }
    };

    try {
      // 1. Primary Target: Resources Named Database
      const primary = await tryEnforceSec(resourcesDb, 'promptresources-db-0');
      if (primary.success && primary.label) return { success: true, message: `Security Headers Enforced on ${primary.label}.`, targetPath: primary.label };

      // 2. Safety Net: Accreditation DB
      const { accreditationDb } = await import('../firebase-admin');
      const final = await tryEnforceSec(accreditationDb, 'promptaccreditation-db-0');
      if (final.success && final.label) return { success: true, message: `Security Headers Enforced on ${final.label} (Clinical Safety Net).`, targetPath: final.label };

      return { success: false, message: 'Could not locate a valid database for Security enforcement.', targetPath: 'ALL_INSTANCES' };

    } catch (error: any) {
      console.error(`[TechnicalEnforcer] ENFORCEMENT_FAILURE (Security): ${error.message}`);
      return {
        success: false,
        message: `Infrastructure Lock Failed: ${error.message}`,
        targetPath: 'UNKNOWN'
      };
    }
  },

  /**
   * Reinstates a flagged/hidden resource in PromptResources.
   * Path: resourcesDb -> resources/{resourceId}
   */
  async reinstateResource(resourceId: string, actor = 'system'): Promise<EnforcementResult> {
    console.log(`[TechnicalEnforcer] Executing_Resource_Reinstatement: ${resourceId} (Actor: ${actor})`);
    try {
      await resourcesDb.collection('resources').doc(resourceId).update({
        status: 'published',
        updatedAt: new Date(),
        reinstatedBy: actor,
        reinstatedAt: new Date()
      });
      
      await AuditService.log({
        action: 'CONTENT_REINSTATED',
        actor,
        targetType: 'resource',
        targetId: resourceId,
        details: { message: 'Resource reinstated after regulatory review.' }
      });

      return { 
        success: true, 
        message: `Resource ${resourceId} successfully reinstated to 'published' status.`, 
        targetPath: 'promptresources/resources' 
      };
    } catch (err: any) {
       console.error(`[TechnicalEnforcer] REINSTATEMENT_FAILURE: ${err.message}`);
       return { 
         success: false, 
         message: `Reinstatement Failed: ${err.message}`, 
         targetPath: 'promptresources/resources' 
       };
    }
  }
};
