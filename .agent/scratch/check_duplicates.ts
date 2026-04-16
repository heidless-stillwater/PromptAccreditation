import { accreditationDb } from '../src/lib/firebase-admin';

async function check() {
  const snap = await accreditationDb.collection('policies').get();
  const dpaEntries = snap.docs.filter(d => d.data().slug === 'data-protection-act');
  console.log('DPA_ENTRIES_COUNT:', dpaEntries.length);
  dpaEntries.forEach(d => {
    console.log('ID:', d.id, 'STATUS:', d.data().status, 'CHECKS:', d.data().checks.length);
  });
}

check();
