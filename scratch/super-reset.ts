const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function superReset() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore(undefined, 'promptaccreditation-db-0');
  const snap = await db.collection('wizard_states').get();
  
  console.log(`[SuperReset] Found ${snap.docs.length} states to purge...`);
  
  const batch = db.batch();
  snap.docs.forEach(doc => {
    console.log(`[SuperReset] Queuing deletion for: ${doc.id}`);
    batch.delete(doc.ref);
  });
  
  if (snap.docs.length > 0) {
    await batch.commit();
    console.log('[SuperReset] SUCCESS: Entire wizard_states collection purged.');
  } else {
    console.log('[SuperReset] Collection already empty.');
  }
}

superReset().catch(console.error);
