const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function auditRegistry() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore(undefined, 'promptaccreditation-db-0');
  const snap = await db.collection('policies').get();
  
  const bySlug = {};
  snap.docs.forEach(doc => {
    const data = doc.data();
    const slug = data.slug || 'MISSING_SLUG';
    if (!bySlug[slug]) bySlug[slug] = [];
    bySlug[slug].push({ id: doc.id, ...data });
  });

  console.log('--- REGISTRY_AUDIT ---');
  Object.keys(bySlug).forEach(slug => {
    console.log(`Slug: ${slug} | Count: ${bySlug[slug].length}`);
    bySlug[slug].forEach(p => {
      console.log(`  -> ID: ${p.id} | Status: ${p.status}`);
    });
  });
}

auditRegistry().catch(console.error);
