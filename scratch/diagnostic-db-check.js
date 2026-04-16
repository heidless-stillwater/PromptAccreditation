const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const dbs = [
    { id: '(default)', name: 'Global Default' },
    { id: 'promptaccreditation-db-0', name: 'Accreditation' },
    { id: 'promptmaster-db-0', name: 'Master' },
    { id: 'promptresources-db-0', name: 'Resources' },
    { id: 'prompttool-db-0', name: 'Tool' }
  ];

  console.log('--- SOVEREIGN_DB_DIAGNOSTIC ---');

  for (const dbInfo of dbs) {
    try {
      const db = dbInfo.id === '(default)' ? getFirestore() : getFirestore(dbInfo.id);
      
      // Attempt a write/read test
      const testRef = db.collection('_diagnostic').doc('probe');
      await testRef.set({
        timestamp: new Date(),
        status: 'online',
        origin: 'diagnostic-script'
      });
      
      const snap = await testRef.get();
      if (snap.exists) {
        console.log(`[PASS] ${dbInfo.name} (${dbInfo.id}): Connection verified.`);
      } else {
        console.log(`[FAIL] ${dbInfo.name} (${dbInfo.id}): Write succeeded but Read failed.`);
      }
    } catch (err) {
      console.log(`[ERROR] ${dbInfo.name} (${dbInfo.id}): ${err.message}`);
    }
  }

  console.log('--- DIAGNOSTIC_COMPLETE ---');
}

diagnose().catch(console.error);
