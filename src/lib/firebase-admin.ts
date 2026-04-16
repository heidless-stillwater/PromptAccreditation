import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

// Force load env if not in Next.js managed environment (e.g. standalone scripts)
if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    // Handle both escaped newlines and quoted strings from .env
    privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[FirebaseAdmin] Missing credentials:', { 
      hasProject: !!projectId, 
      hasEmail: !!clientEmail, 
      hasKey: !!privateKey 
    });
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);

function initDb(name?: string) {
  try {
    const db = name ? getFirestore(adminApp, name) : getFirestore(adminApp);
    // Clinical connectivity hint: Verify if it exists
    if (name) {
       console.log(`[FirebaseAdmin] Initialized connection to named database: ${name}`);
    }
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch (e) {
      // Ignore: settings already applied during previous HMR cycle
    }
    return db;
  } catch (err: any) {
    if (name && err.message.includes('NOT_FOUND')) {
      console.warn(`[FirebaseAdmin] SOVEREIGN_FALLBACK: Named database '${name}' not found. Falling back to (default).`);
      return getFirestore(adminApp);
    }
    throw err;
  }
}

/** SOVEREIGN RESTORATION: Dedicated Named Databases */
export const accreditationDb = initDb('promptaccreditation-db-0');
export const masterDb = initDb('promptmaster-db-0');
export const resourcesDb = initDb('promptresources-db-0');
export const toolDb = initDb('prompttool-db-0');
export const globalDb = initDb(); // Auth/Global remains on Default

export default adminApp;
