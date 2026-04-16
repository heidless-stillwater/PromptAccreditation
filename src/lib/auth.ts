import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

const SESSION_NAME = 'prompt_session';
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function createSession(idToken: string) {
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_NAME, sessionCookie, {
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    
    // Fetch profile from Global Hub
    const decodedClaims = await adminAuth.verifyIdToken(idToken);
    const { globalDb } = await import('./firebase-admin');
    const userSnap = await globalDb.collection('users').doc(decodedClaims.uid).get();
    const profile = userSnap.data();

    return {
        uid: decodedClaims.uid,
        email: decodedClaims.email || '',
        displayName: decodedClaims.name || '',
        isAdmin: profile?.isAdmin || false,
        tier: profile?.tier || 'free'
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
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Fetch extended profile from Global Hub
    const { globalDb } = await import('./firebase-admin');
    const userSnap = await globalDb.collection('users').doc(decodedClaims.uid).get();
    const profile = userSnap.data();

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      displayName: decodedClaims.name || '',
      photoURL: decodedClaims.picture || '',
      isAdmin: profile?.isAdmin || false,
      tier: profile?.tier || 'free',
    };
  } catch (error) {
    return null;
  }
}
