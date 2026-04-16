const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspect() {
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
  
  console.log(`Found ${snap.docs.length} wizard states:`);
  snap.docs.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    console.log(`Data:`, JSON.stringify(doc.data(), null, 2));
  });
}

inspect().catch(console.error);
