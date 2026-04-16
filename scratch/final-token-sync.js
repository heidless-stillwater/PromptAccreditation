const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findSecretInSystemConfig() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const dbs = ['(default)', 'promptaccreditation-db-0', 'promptmaster-db-0', 'promptresources-db-0', 'prompttool-db-0'];
  
  for (const dbId of dbs) {
     try {
       console.log(`--- SEARCHING_DB: ${dbId} ---`);
       const db = dbId === '(default)' ? getFirestore() : getFirestore(undefined, dbId);
       const doc = await db.collection('system_config').doc('global_secrets').get();
       if (doc.exists) {
         console.log(`FOUND SECRETS IN ${dbId}: ${Object.keys(doc.data()).join(', ')}`);
         
         // If we found them, migrate them to the current live DB (default)
         const defaultDb = getFirestore();
         await defaultDb.collection('system_config').doc('global_secrets').set(doc.data(), { merge: true });
         console.log(`--- MIGRATED_SECRETS_FROM_${dbId}_TO_DEFAULT ---`);
       }
     } catch (e) {
       console.log(`Skipping ${dbId} (Not Found)`);
     }
  }
}

findSecretInSystemConfig().catch(console.error);
