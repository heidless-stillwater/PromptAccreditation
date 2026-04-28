import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * SOVEREIGN ADMIN INITIALIZATION (Anti-Deadlock Edition)
 */

let adminApp: App | null = null;
const dbCache: Record<string, Firestore> = {};

function initAdmin(): App | null {
  if (typeof window !== 'undefined') return null;
  if (adminApp) return adminApp;
  const apps = getApps();
  if (apps.length > 0) { adminApp = apps[0]; return adminApp; }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !privateKey || !clientEmail) return null;

  try {
    const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim();
    adminApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey: formattedKey }) });
    return adminApp;
  } catch (error: any) {
    console.error('[FirebaseAdmin] Handshake_CRASH:', error.message);
    return null;
  }
}

/**
 * COMPATIBILITY GETTERS
 */
export function getAdminAuth(): Auth | null {
  const app = initAdmin();
  return app ? getAuth(app) : null;
}

export function getDb(name?: string): Firestore | null {
  const app = initAdmin();
  if (!app) return null;
  const targetDb = name || process.env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0';
  if (dbCache[targetDb]) return dbCache[targetDb];
  try {
    const db = (targetDb === '(default)') ? getFirestore(app) : getFirestore(app, targetDb);
    try { (db as any).settings({ ignoreUndefinedProperties: true }); } catch (e) {}
    dbCache[targetDb] = db;
    return db;
  } catch (err: any) {
    console.error(`[FirebaseAdmin] getDb_FAULT (${targetDb}):`, err.message);
    return null;
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`[Sovereign] Database timeout after ${timeoutMs}ms.`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

/**
 * RECURSIVE STABILITY PROXY
 */
function createRecursiveProxy(target: any): any {
  return new Proxy(target, {
    get(t, prop: string) {
      const value = Reflect.get(t, prop);
      if (typeof value === 'function') {
        if (['get', 'set', 'update', 'add', 'delete'].includes(prop)) {
          return (...args: any[]) => withTimeout(value.apply(t, args));
        }
        return (...args: any[]) => {
          const result = value.apply(t, args);
          return (result && typeof result === 'object') ? createRecursiveProxy(result) : result;
        };
      }
      return value;
    }
  });
}

const createLazyDb = (name: string) => {
    return new Proxy({} as Firestore, {
        get(_, prop: string) {
            const db = getDb(name);
            if (!db) {
                if (['collection', 'doc', 'where', 'limit', 'orderBy', 'count'].includes(prop)) return () => createLazyDb(name);
                if (prop === 'get') return () => Promise.resolve({ exists: false, docs: [], data: () => ({}) });

                return undefined;
            }
            return createRecursiveProxy(db)[prop];
        }
    });
};

// COMPATIBILITY EXPORTS
export const accreditationDb = createLazyDb('promptaccreditation-db-0');
export const globalDb = accreditationDb;
export const monitoringDb = accreditationDb;
export const clinicalDb = accreditationDb;
export const sentinelDb = accreditationDb;

export const resourcesDb = createLazyDb('promptresources-db-0');
export const masterDb = createLazyDb('prompttool-db-0');
export const toolDb = masterDb;

export const adminAuth = new Proxy({} as Auth, {
    get(_, prop: string) {
        const auth = getAdminAuth();
        if (!auth) throw new Error('Auth unavailable');
        const value = Reflect.get(auth, prop);
        return typeof value === 'function' ? value.bind(auth) : value;
    }
});
