const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findMasterDB() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const variations = [
    'promptmaster-db-0',
    'promptmaster-db',
    'prompt-master-db-0',
    'prompt-master-db',
    'master-db-0',
    'master-db',
    'promptmaster-db-1'
  ];

  console.log('--- SOVEREIGN_DB_SEARCH: MASTER_INSTANCE ---');

  for (const dbId of variations) {
    try {
      const db = getFirestore(dbId);
      // Minimal read test
      await db.collection('_probe').doc('test').get();
      console.log(`[PASS] Found active database: ${dbId}`);
    } catch (err) {
      if (err.message.includes('NOT_FOUND')) {
        // Log nothing for missing DBs
      } else {
        console.log(`[WARN] ${dbId}: ${err.message}`);
      }
    }
  }

  console.log('--- SEARCH_COMPLETE ---');
}

findMasterDB().catch(console.error);
