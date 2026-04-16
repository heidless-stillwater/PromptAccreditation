const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditStates() {
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
  
  console.log('--- WIZARD_STATE_AUDIT ---');
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | User: ${data.userId} | Policy: ${data.policyId} | Steps: ${data.stepsCompleted?.length}`);
  });
}

auditStates().catch(console.error);
