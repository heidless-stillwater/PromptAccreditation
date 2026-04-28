import './load-env';
import { getDb } from '../src/lib/firebase-admin';

async function deleteOpenTickets() {
  const db = getDb('promptaccreditation-db-0');
  if (!db) {
    console.error('Could not connect to Accreditation DB.');
    process.exit(1);
  }

  const snap = await db
    .collection('tickets')
    .where('status', 'in', ['open', 'in_progress'])
    .get();

  if (snap.empty) {
    console.log('No open tickets found.');
    return;
  }

  console.log(`Found ${snap.docs.length} open ticket(s):`);
  const batch = db.batch();
  for (const doc of snap.docs) {
    console.log(`  - [${doc.id}] ${doc.data().title} (${doc.data().priority})`);
    batch.delete(doc.ref);
  }

  await batch.commit();
  console.log('All open tickets deleted.');
}

deleteOpenTickets().catch(console.error);
