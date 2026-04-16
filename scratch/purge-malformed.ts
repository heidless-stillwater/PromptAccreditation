const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function purgeMalformed() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore(undefined, 'promptaccreditation-db-0');
  const ids = ['2sLRzZKU91Otr7YwFOyu', 'AlUniZS6mAQq6IM12L81', 'X5EzJi2BML7l5huf7xBt'];
  
  for (const id of ids) {
    console.log(`[Purge] Deleting malformed policy document: ${id}`);
    await db.collection('policies').doc(id).delete();
  }
  
  console.log('[Purge] Malformed documents cleared.');
}

purgeMalformed().catch(console.error);
