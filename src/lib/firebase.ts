import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Using canonical domain to bypass Google Auth 400 redirect_uri_mismatch
  authDomain: 'heidless-apps-0.firebaseapp.com', 
  projectId: 'heidless-apps-0',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('[Firebase][Client] Initializing with Project:', firebaseConfig.projectId);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Force local persistence to ensure session survives page refreshes in Next.js 15
if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(err => {
        console.error('[Firebase] Persistence error:', err);
    });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
