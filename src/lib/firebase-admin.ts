import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * SOVEREIGN ADMIN INITIALIZATION
 * Stable singleton pattern for Next.js 15 / Cloud Run.
 */

let adminApp: App | null = null;

/**
 * TRACEABLE APP INITIALIZER
 * Uses direct stdout to bypass framework log buffering.
 */
function getAdminApp(name: string = 'SOVEREIGN'): App | null {
  if (typeof window !== 'undefined') return null;
  if (adminApp) return adminApp;

  try {
    process.stdout.write(`[FirebaseAdmin] HANDSHAKE_START: ${name}\n`);
    const apps = getApps();
    const existing = apps.find((a) => a.name === name);
    if (existing) {
        adminApp = existing;
        return adminApp;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !privateKey) {
        process.stdout.write(`[FirebaseAdmin] HANDSHAKE_VOID: Missing credentials\n`);
        return null;
    }

    process.stdout.write(`[FirebaseAdmin] PREPARING_CERT: ${projectId}\n`);
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim();
    const credential = cert({ projectId, clientEmail, privateKey });

    process.stdout.write(`[FirebaseAdmin] INITIALIZING_APP: ${name}\n`);
    adminApp = initializeApp({
      credential,
    }, name);

    return adminApp;
  } catch (error: any) {
    process.stdout.write(`[FirebaseAdmin] HANDSHAKE_CRASH: ${error.message} - ${error.stack}\n`);
    return null;
  }
}

// Service Getters
export const getAdminAuth = (): Auth | null => {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
};

/**
 * Get Firestore instance for a specific database.
 */
export const getDb = (name?: string): Firestore | null => {
  const app = getAdminApp();
  if (!app) return null;
  
  // SOVEREIGN DATABASE TARGETING:
  // Forced targeting to promptaccreditation-db-0 per user requirement.
  const targetDb = name || process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0';
  
  try {
    return getFirestore(app, targetDb);
  } catch (err) {
    process.stdout.write(`[FirebaseAdmin] Firestore error (${targetDb}): ${err}\n`);
    return getFirestore(app);
  }
};

// Diagnostics
export const getDebugInfo = () => {
  const pk = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  return {
    hasProjectId: !!(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    hasClientEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    hasPrivateKey: !!pk,
    isPrivateKeyValid: pk.includes('BEGIN PRIVATE KEY') || pk.includes('\\n'),
    keyLength: pk.length,
    nodeVersion: process.version
  };
};

/**
 * LEGACY EXPORTS (LAZY PROXIES)
 * These allow 'import { globalDb } from ...' without triggering initialization at build time.
 */
const createLazyDb = (name?: string) => {
    return new Proxy({} as Firestore, {
        get(_, prop) {
            const db = getDb(name);
            if (!db) {
                return (...args: any[]) => ({
                    collection: () => createLazyDb(name),
                    doc: () => createLazyDb(name),
                    get: () => Promise.resolve({ exists: false, docs: [], data: () => ({}) }),
                    where: () => createLazyDb(name),
                    orderBy: () => createLazyDb(name),
                    limit: () => createLazyDb(name),
                });
            }
            return Reflect.get(db, prop);
        }
    });
};

export const globalDb = createLazyDb();
export const accreditationDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');
export const monitoringDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');
export const resourcesDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');
export const masterDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');
export const toolDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');
export const clinicalDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');
export const sentinelDb = createLazyDb(process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0');

// Auth Legacy Export
export const adminAuth = new Proxy({} as Auth, {
    get(_, prop) {
        const auth = getAdminAuth();
        if (!auth) throw new Error('[Sovereign] Admin Auth accessed before initialization.');
        return Reflect.get(auth, prop);
    }
});
