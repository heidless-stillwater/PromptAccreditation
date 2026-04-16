const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkEncryption() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore(undefined, 'promptmaster-db-0');
  const doc = await db.collection('config').doc('encryption_status').get();
  
  if (doc.exists) {
    console.log('Encryption Status:', JSON.stringify(doc.data(), null, 2));
  } else {
    console.log('No encryption status found in promptmaster-db-0');
  }
}

checkEncryption().catch(console.error);
