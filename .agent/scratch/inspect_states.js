const { accreditationDb } = require('./src/lib/firebase-admin');

async function dumpStates() {
  console.log('--- WIZARD STATES DUMP ---');
  const snap = await accreditationDb.collection('wizard_states').get();
  snap.forEach(doc => {
    console.log(`ID: ${doc.id}`);
    const data = doc.data();
    console.log(`  PolicyId: ${data.policyId}`);
    console.log(`  EvidenceKeys: ${Object.keys(data.evidenceUploaded || {})}`);
    if (data.evidenceUploaded?.['dpa-step-3']) {
      console.log(`  DPA-STEP-3: [YES] Length: ${data.evidenceUploaded['dpa-step-3'].length}`);
    }
    console.log('---------------------------');
  });
}

dumpStates().catch(console.error);
