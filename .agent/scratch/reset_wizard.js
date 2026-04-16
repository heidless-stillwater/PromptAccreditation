const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Using actual env for the script
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});
const db = getFirestore(app, 'promptaccreditation-db-0');

async function reset() {
  const policyId = 'data-protection-act';
  const userId = 'local-user';
  const docId = `${policyId}_${userId}`;
  
  console.log(`[Reset] Purging state for ${docId} in Firestore...`);
  try {
    await db.collection('wizard_states').doc(docId).delete();
    console.log('[Reset] SUCCESS: State purged.');
  } catch (e) {
    console.error('[Reset] FAILED:', e.message);
  }
}

reset();
