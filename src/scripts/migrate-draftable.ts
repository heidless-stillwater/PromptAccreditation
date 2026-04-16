/**
 * Migration script to update existing policies with 'draftable' flag.
 * Run with: npx tsx src/scripts/migrate-draftable.ts
 */
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore(getApps()[0], 'promptaccreditation-db-0');
}

async function migrate() {
  const db = getDb();
  console.log('🚀 Migrating policy metadata in promptaccreditation-db-0...');

  const osaRef = db.collection('policies').doc('online-safety-act');
  const osaSnap = await osaRef.get();
  
  if (osaSnap.exists) {
    const data = osaSnap.data();
    const steps = data?.implementationGuide || [];
    if (steps.length > 0) {
      steps[0].draftable = true;
      await osaRef.update({ implementationGuide: steps });
      console.log('  ✅ Online Safety Act Step 1 set to draftable: true');
    }
  } else {
    console.log('  ❌ Online Safety Act policy not found in DB.');
  }

  console.log('\n✨ Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
