const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function audit() {
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
  if (snap.empty) {
    console.log('NO_STATE_FOUND');
    return;
  }

  const states = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const latest = states.sort((a,b) => {
    const timeA = a.lastActivityAt?._seconds || 0;
    const timeB = b.lastActivityAt?._seconds || 0;
    return timeB - timeA;
  })[0];

  console.log('POLICY_ID:', latest.policyId);
  console.log('\n--- DOSSIER CONTENT ---');
  console.log(latest.evidenceUploaded['dpa-step-1']);
  console.log('\n--- TASKS LIST ---');
  console.log(latest.checklistsUploaded['dpa-step-1']);
}

audit().catch(console.error);
