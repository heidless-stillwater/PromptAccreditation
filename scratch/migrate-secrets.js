const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateSecrets() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  // 1. Fetch from old DB
  const oldDb = getFirestore(undefined, 'promptaccreditation-db-0');
  const oldSnap = await oldDb.collection('system_settings').doc('config').get();
  
  if (!oldSnap.exists) {
    console.log('Secret Not Found in promptaccreditation-db-0. Checking (default)...');
  } else {
    const data = oldSnap.data();
    console.log(`Found Secrets in old DB: ${Object.keys(data).join(', ')}`);
    
    // 2. Write to Default DB
    const defaultDb = getFirestore();
    await defaultDb.collection('system_settings').doc('config').set(data, { merge: true });
    console.log('--- SECRETS_MIGRATED_TO_DEFAULT_DB ---');
    return;
  }

  // 3. Fallback: If not in old DB, maybe it was in (default) all along but in a different doc?
  const defaultDb = getFirestore();
  const defSnap = await defaultDb.collection('system_settings').doc('config').get();
  if (defSnap.exists) {
     console.log(`Secrets already exist in Default DB: ${Object.keys(defSnap.data()).join(', ')}`);
  }
}

migrateSecrets().catch(console.error);
