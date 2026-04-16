const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateToSovereignDB() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const srcDb = getFirestore(); // (default)
  const destDb = getFirestore(undefined, 'promptaccreditation-db-0');
  
  console.log('--- STARTING_SOVEREIGN_MIGRATION ---');
  console.log('Source: (default)');
  console.log('Target: promptaccreditation-db-0');

  const collections = ['policies', 'tickets', 'wizard_states', 'audit_logs'];

  for (const colName of collections) {
    console.log(`Migrating Collection: ${colName}...`);
    const snap = await srcDb.collection(colName).get();
    console.log(`Found ${snap.docs.length} documents.`);

    const batch = destDb.batch();
    snap.docs.forEach(doc => {
      console.log(`  -> Copying Doc: ${doc.id}`);
      batch.set(destDb.collection(colName).doc(doc.id), doc.data());
    });
    
    if (snap.docs.length > 0) {
      await batch.commit();
      console.log(`  [OK] ${colName} migrated.`);
    } else {
      console.log(`  [SKIP] ${colName} is empty.`);
    }
  }

  console.log('--- MIGRATION_COMPLETE ---');
}

migrateToSovereignDB().catch(err => {
  console.error('MIGRATION_FAILED:', err);
  process.exit(1);
});
