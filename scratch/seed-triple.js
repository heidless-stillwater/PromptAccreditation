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
    category: 'data',
    status: 'amber',
    regulatoryBody: 'ICO (UK)',
    definition: 'Controls how your personal information is used organisational wide.',
    intensity: 'standard_enforcement',
    maxPenalty: '£17.5m or 4% of turnover',
    checks: [
      { id: 'dpa-step-1', title: 'Data Audit & Mapping', status: 'amber' },
      { id: 'dpa-step-2', title: 'Encryption Enforcement', status: 'red' },
      { id: 'dpa-step-3', title: 'Privacy Policy Synthesizer', status: 'amber' }
    ],
    implementationGuide: [
      { id: 'dpa-step-1', title: 'Data Audit & Mapping', description: 'Map all PII data flows.', guidance: 'Use the AI to catalog your data.', draftable: true },
      { id: 'dpa-step-2', title: 'Encryption Enforcement', description: 'Enforce AES-256.', guidance: 'Apply technical measures.', draftable: true },
      { id: 'dpa-step-3', title: 'Privacy Policy Synthesizer', description: 'Generate public policy.', guidance: 'Synthesize the final document.', draftable: true }
    ],
    checksAndBalances: 'Standard audit checks.',
    risksAndConsequences: 'High risk of PII leak.'
  },
  {
    id: 'online-safety-act',
    slug: 'online-safety-act',
    name: 'Online Safety Act 2023',
    category: 'safety',
    status: 'red',
    regulatoryBody: 'Ofcom (UK)',
    definition: 'New rules for social media and search engines to protect children and adults online.',
    intensity: 'light_touch',
    maxPenalty: '£18m or 10% of revenue',
    checks: [
      { id: 'osa-step-1', title: 'Age Verification Protocol', status: 'red' },
      { id: 'osa-step-2', title: 'Harmful Content Triage', status: 'red' }
    ],
    implementationGuide: [
      { id: 'osa-step-1', title: 'Age Verification', description: 'Implement AV systems.', guidance: 'Ensure children are excluded from adult content.', draftable: true },
      { id: 'osa-step-2', title: 'Content Triage', description: 'AI content filtering.', guidance: 'Filter harmful material.', draftable: true }
    ],
    checksAndBalances: 'Content moderation audits.',
    risksAndConsequences: 'Exposure of minors to harmful content.'
  },
  {
    id: 'site-security',
    slug: 'site-security',
    name: 'Infrastructure Security',
    category: 'security',
    status: 'green',
    regulatoryBody: 'NCSC (UK)',
    definition: 'Measures to ensure the physical and virtual security of site infrastructure.',
    intensity: 'heavy_duty',
    maxPenalty: 'Criminal prosecution',
    checks: [
      { id: 'sec-step-1', title: 'Penetration Testing', status: 'green' },
      { id: 'sec-step-2', title: 'Firewall Optimization', status: 'green' }
    ],
    implementationGuide: [
      { id: 'sec-step-1', title: 'Penetration Test', description: 'Annual security audit.', guidance: 'Hire external white-hats.', draftable: false },
      { id: 'sec-step-2', title: 'Firewall', description: 'Optimize rules.', guidance: 'Review egress rules.', draftable: true }
    ],
    checksAndBalances: 'Monthly log reviews.',
    risksAndConsequences: 'Full system breach.'
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
  console.log('--- TRIPLE_SEED_COMPLETE ---');
}

seed().catch(console.error);
