import { decrypt } from './crypto';

const CACHE_TTL = 1000; // 1 second cache for testing propagation
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

    console.log(`[ConfigHub] Syncing secret: ${key}...`);

    try {
        // Fetch from PromptTool Hub (prompttool-db-0 -> system_config/global_secrets)
        const { accreditationDb } = await import('./firebase-admin');
        const doc = await accreditationDb.collection('system_config').doc('global_secrets').get();
        
        if (doc.exists) {
            const data = doc.data();
            const encryptedValue = data?.[key];

            if (encryptedValue && typeof encryptedValue === 'string') {
                console.log(`[ConfigHub] Found encrypted value for ${key}. Decrypting...`);
                // 3. Decrypt
                const decrypted = decrypt(encryptedValue);
                
                if (decrypted) {
                    console.log(`[ConfigHub] SUCCESS: Decrypted ${key} (Length: ${decrypted.length})`);
                }

                // 4. Update Cache
                secretCache[key] = {
                    value: decrypted,
                    expires: now + CACHE_TTL
                };

                return decrypted;
            } else {
                console.warn(`[ConfigHub] FAILED: Key ${key} not found in Firestore doc.`);
            }
        } else {
            console.error('[ConfigHub] FAILED: Master global_secrets document missing from Firestore.');
        }
    } catch (error) {
        console.error(`[ConfigHub] CRITICAL ERROR fetching secret [${key}]:`, error);
    }

    // 5. Final Fallback to process.env
    const fallback = process.env[key];
    if (fallback) {
        console.log(`[ConfigHub] Falling back to local process.env for ${key}`);
    }
    return fallback;
}
