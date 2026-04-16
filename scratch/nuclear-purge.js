const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function purgeAllStates() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore(); // DEFAULT DATABASE
  
  // 1. Purge Wizard States
  const wizardSnap = await db.collection('wizard_states').get();
  console.log(`--- PURGING_${wizardSnap.docs.length}_WIZARD_STATES ---`);
  let batch = db.batch();
  wizardSnap.docs.forEach(doc => {
    console.log(`Deleting State: ${doc.id}`);
    batch.delete(doc.ref);
  });
  await batch.commit();

  // 2. Purge Tickets
  const ticketSnap = await db.collection('tickets').get();
  console.log(`--- PURGING_${ticketSnap.docs.length}_TICKETS ---`);
  batch = db.batch();
  ticketSnap.docs.forEach(doc => {
    console.log(`Deleting Ticket: ${doc.id}`);
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log('--- SOVEREIGN_PURGE_COMPLETE ---');
}

purgeAllStates().catch(console.error);
