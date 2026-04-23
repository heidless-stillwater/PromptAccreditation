import { cookies } from 'next/headers';
import { getAdminAuth, getDb } from './firebase-admin';
import { EntitlementService } from './services/entitlements';

const SESSION_NAME = '__session';
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSession(idToken: string) {
  try {
    const auth = getAdminAuth();
    if (!auth) throw new Error('Admin Auth unavailable');

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_NAME, sessionCookie, {
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    
    // Fetch profile from Global Hub
    const decodedClaims = await auth.verifyIdToken(idToken);
    const db = getDb();
    if (!db) throw new Error('Global DB unavailable');

    const userSnap = await db.collection('users').doc(decodedClaims.uid).get();
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
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_NAME)?.value;
  
  if (!sessionCookie) return null;
  
  try {
    const auth = getAdminAuth();
    if (!auth) {
        console.warn('[Auth] getSessionUser: adminAuth unavailable');
        return null;
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Fetch extended profile from Global Hub
    const db = getDb();
    if (!db) {
        console.warn('[Auth] getSessionUser: globalDb unavailable');
        return {
            uid: decodedClaims.uid,
            email: decodedClaims.email || '',
            displayName: decodedClaims.name || '',
            isAdmin: false,
            tier: 'free' as any
        };
    }

    const userSnap = await db.collection('users').doc(decodedClaims.uid).get();
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
