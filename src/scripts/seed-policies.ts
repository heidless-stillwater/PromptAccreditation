/**
 * Seed script — populates promptaccreditation-db-0 with initial policies.
 * Run with: npx tsx src/scripts/seed-policies.ts
 */
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { INITIAL_POLICIES } from '../lib/constants';

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

async function seed() {
  const db = getDb();
  console.log('🌱 Seeding policies into promptaccreditation-db-0...\n');

  for (const policy of INITIAL_POLICIES) {
    const docRef = db.collection('policies').doc(policy.slug);
    const existing = await docRef.get();
    
    await docRef.set({
      ...policy,
      createdAt: existing.exists ? existing.data()?.createdAt : new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    console.log(`  ✅ Synchronized: ${policy.name} (${policy.slug})`);
  }

  console.log('\n✨ Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
