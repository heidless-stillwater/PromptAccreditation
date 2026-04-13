import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);

// ═══════════════════════════════════════════════════════
// DATABASE CONSTELLATION
// ═══════════════════════════════════════════════════════

/** THIS APP — Policy governance, tickets, audit, KB */
export const accreditationDb = getFirestore(adminApp, 'promptaccreditation-db-0');

/** MASTER SPA — Registry & admin compliance config */
export const masterDb = getFirestore(adminApp, 'promptmaster-db-0');

/** RESOURCES — Content library, AV & protection config */
export const resourcesDb = getFirestore(adminApp, 'promptresources-db-0');

/** PROMPT TOOL — Workbench security config */
export const toolDb = getFirestore(adminApp, 'prompttool-db-0');

/** GLOBAL IDENTITY — Users, subscriptions, encrypted secrets */
export const globalDb = getFirestore(adminApp);

export default adminApp;
