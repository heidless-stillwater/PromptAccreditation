import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
    credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
};

// Initialize Admin SDK Singleton
const adminApp = getApps().length === 0 ? initializeApp(adminConfig) : getApps()[0];

export const adminAuth = getAuth(adminApp);

/**
 * 1. Accreditation Database (THIS APP)
 */
export const accreditationDb = getFirestore(adminApp, 'promptaccreditation-db-0');

/**
 * 2. Master Admin Database
 */
export const masterDb = getFirestore(adminApp, 'promptmaster-db-0');

/**
 * 3. Prompt Resources Database
 */
export const resourcesDb = getFirestore(adminApp, 'promptresources-db-0');

/**
 * 4. Prompt Tool Database
 */
export const toolDb = getFirestore(adminApp, 'prompttool-db-0');

/**
 * 5. Global Config & Secrets (Default Database)
 */
export const globalDb = getFirestore(adminApp);

export default adminApp;
