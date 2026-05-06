import { getAdminAuth, getDb, withTimeout } from './firebase-admin';
import { EntitlementService } from './services/entitlements';

const SESSION_NAME = '__session';
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSession(idToken: string) {
  try {
    const auth = await getAdminAuth();
    if (!auth) throw new Error('Admin Auth unavailable');

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });
    if (typeof window !== 'undefined') throw new Error('Cannot create session on client');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_NAME, sessionCookie, {
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    
    // Fetch profile from Named Hub
    const decodedClaims = await auth.verifyIdToken(idToken);
    const { accreditationDb } = await import('./firebase-admin');
    if (!accreditationDb) throw new Error('Accreditation DB unavailable');

    const userSnap = await withTimeout(accreditationDb.collection('users').doc(decodedClaims.uid).get()) as any;
    const profile = userSnap.data();

    return {
        uid: decodedClaims.uid,
        email: decodedClaims.email || '',
        displayName: decodedClaims.name || '',
        isAdmin: profile?.isAdmin || false,
        tier: await EntitlementService.getAccreditationTier(decodedClaims.uid)
    };
  } catch (error) {
    console.error('[Auth] Failed to create session:', error);
    return null;
  }
}

export async function destroySession() {
  if (typeof window !== 'undefined') return;
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);
}

export async function getSessionUser() {
  if (typeof window !== 'undefined') return null;
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_NAME)?.value;
  
  if (!sessionCookie) return null;
  
  try {
    const auth = await getAdminAuth();
    if (!auth) {
        console.warn('[Auth] getSessionUser: adminAuth unavailable');
        return null;
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Fetch extended profile from Named Hub
    const db = await getDb();
    if (!db) {
        console.warn('[Auth] getSessionUser: accreditationDb unavailable');
        return {
            uid: decodedClaims.uid,
            email: decodedClaims.email || '',
            displayName: decodedClaims.name || '',
            isAdmin: false,
            tier: 'free' as any
        };
    }

    const userSnap = await withTimeout(db.collection('users').doc(decodedClaims.uid).get()) as any;
    const profile = userSnap.data();

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      displayName: decodedClaims.name || '',
      photoURL: decodedClaims.picture || '',
      isAdmin: profile?.isAdmin || false,
      tier: await EntitlementService.getAccreditationTier(decodedClaims.uid),
    };
  } catch (error) {
    return null;
  }
}
