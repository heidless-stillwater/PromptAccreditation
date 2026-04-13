import { globalDb } from './firebase-admin';
import { decrypt } from './crypto';

const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache
const secretCache: Record<string, { value: string; expires: number }> = {};

/**
 * Retrieves a secret from the global configuration store in Firestore (default DB).
 * Implements real-time decryption and a short-lived in-memory cache.
 */
export async function getSecret(key: string): Promise<string | undefined> {
    const now = Date.now();

    // 1. Check Cache
    if (secretCache[key] && secretCache[key].expires > now) {
        return secretCache[key].value;
    }

    try {
        // 2. Fetch from Firestore (Default DB -> system_config/global_secrets)
        const doc = await globalDb.collection('system_config').doc('global_secrets').get();
        
        if (doc.exists) {
            const data = doc.data();
            const encryptedValue = data?.[key];

            if (encryptedValue && typeof encryptedValue === 'string') {
                // 3. Decrypt
                const decrypted = decrypt(encryptedValue);
                
                // 4. Update Cache
                secretCache[key] = {
                    value: decrypted,
                    expires: now + CACHE_TTL
                };

                return decrypted;
            }
        }
    } catch (error) {
        console.warn(`[ConfigHelper] Failed to fetch secret [${key}] from Firestore:`, error);
    }

    // 5. Final Fallback to process.env
    return process.env[key];
}
