import { accreditationDb } from '../lib/firebase-admin';

async function seedDPATicket() {
  console.log('🎫 Generating DPA Compliance Ticket...');

  const ticket = {
    policyId: 'data-protection',
    checkId: 'dpa-encryption',
    status: 'open',
    priority: 'high',
    title: 'Data Encryption at Rest: FAILED',
    description: 'A structural audit revealed that sensitive user PII in the Master Registry is not currently enforced with AES-256-GCM encryption. Triggering "Active Fix" will update the Master Registry governance flags to mandate encryption suite-wide.',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const docRef = await accreditationDb.collection('tickets').add(ticket);
  console.log(`✅ DPA Ticket Created: ${docRef.id}`);
  process.exit(0);
}

seedDPATicket().catch(console.error);
