const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const INITIAL_POLICIES = [
  {
    id: 'data-protection-act',
    slug: 'data-protection-act',
    name: 'Data Protection Act 2018',
    status: 'amber',
    regulatoryBody: 'ICO (UK)',
    definition: 'Controls how your personal information is used by organisations, businesses or the government.',
    intensity: 'standard_enforcement',
    checks: [
      { id: 'dpa-step-1', title: 'Data Audit & Mapping', status: 'amber' },
      { id: 'dpa-step-2', title: 'Encryption Enforcement', status: 'red' },
      { id: 'dpa-step-3', title: 'Privacy Policy Synthesizer', status: 'amber' }
    ],
    implementationGuide: [
      { id: 'dpa-step-1', title: 'Data Audit & Mapping', description: 'Map all PII data flows.', guidance: 'Use the AI to catalog your data.', draftable: true },
      { id: 'dpa-step-2', title: 'Encryption Enforcement', description: 'Enforce AES-256.', guidance: 'Apply technical measures.', draftable: true },
      { id: 'dpa-step-3', title: 'Privacy Policy Synthesizer', description: 'Generate public policy.', guidance: 'Synthesize the final document.', draftable: true }
    ]
  }
];

async function seed() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  
  const db = getFirestore(); // Default DB
  const batch = db.batch();
  
  INITIAL_POLICIES.forEach(p => {
    const ref = db.collection('policies').doc(p.id);
    batch.set(ref, { ...p, updatedAt: new Date() });
  });
  
  await batch.commit();
  console.log('--- SEED_COMPLETE_DEFAULT_DB ---');
}

seed().catch(console.error);
