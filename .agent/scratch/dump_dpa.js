const admin = require('firebase-admin');
const path = require('path');

// Initialize with the environment's service account or default credentials
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'promptaccreditation-db-0'
  });
}

const db = admin.firestore();

async function dump() {
  console.log('--- START DPA AUDIT ---');
  const snap = await db.collection('policies').get();
  snap.docs.forEach(doc => {
    const data = doc.data();
    if (data.slug === 'data-protection-act' || data.name?.includes('Data Protection')) {
      console.log('ID:', doc.id);
      console.log('SLUG:', data.slug);
      console.log('STATUS:', data.status);
      console.log('CHECKS_COUNT:', data.checks?.length);
      data.checks?.forEach(c => {
         console.log('  - CHECK:', c.id, 'STATUS:', c.status);
      });
      console.log('---');
    }
  });
}

dump().catch(console.error);
