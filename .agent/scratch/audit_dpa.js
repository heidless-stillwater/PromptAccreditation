const { accreditationDb } = require('../dist/lib/firebase-admin');

async function audit() {
  try {
    const snap = await accreditationDb.collection('policies').where('slug', '==', 'data-protection-act').get();
    if (snap.empty) {
      console.log('POLICY_NOT_FOUND');
      return;
    }
    const data = snap.docs[0].data();
    console.log('POLICY_STATUS:', data.status);
    data.checks.forEach(c => {
      console.log('CHECK:', c.id, 'STATUS:', c.status);
    });
  } catch (e) {
    console.error(e);
  }
}

audit();
