const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findTheState() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const dbs = ['(default)', 'promptaccreditation-db-0', 'promptmaster-db-0', 'promptresources-db-0'];
  
  for (const dbId of dbs) {
     console.log(`--- SCANNING_DB: ${dbId} ---`);
     const db = dbId === '(default)' ? getFirestore() : getFirestore(undefined, dbId);
     const snap = await db.collection('wizard_states').get();
     snap.docs.forEach(doc => {
       console.log(`Found State in ${dbId}: ${doc.id}`);
     });
  }
}

findTheState().catch(console.error);
