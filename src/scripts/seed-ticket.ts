import { accreditationDb } from '../lib/firebase-admin';

async function seedTicket() {
  console.log('🎫 Generating Compliance Ticket...');

  const ticket = {
    policyId: 'online-safety',
    checkId: 'safety-report-1',
    status: 'open',
    priority: 'high',
    title: 'Missing Transparency Report (2025)',
    description: 'The ecosystem has failed to generate the mandatory annual transparency report required by the Online Safety Act Section 12. "Active Fix" will trigger the automated report generator and sync it to the public hub.',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const docRef = await accreditationDb.collection('tickets').add(ticket);
  console.log(`✅ Ticket Created: ${docRef.id}`);
  process.exit(0);
}

seedTicket().catch(console.error);
