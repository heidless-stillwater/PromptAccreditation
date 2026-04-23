import './load-env';
import { accreditationDb } from '../lib/firebase-admin';

async function hardenDatabase() {
  console.log('--- Starting Database Hardening ---');

  // 1. Clean up Tickets
  const ticketSnap = await accreditationDb.collection('tickets').get();
  console.log(`Checking ${ticketSnap.docs.length} tickets...`);
  
  for (const doc of ticketSnap.docs) {
    const data = doc.data();
    const updates: any = {};
    
    if (!data.timeline) updates.timeline = [];
    if (!data.affectedApps) updates.affectedApps = [];
    if (!data.status) updates.status = 'open';
    if (!data.priority) updates.priority = 'medium';
    if (!data.severity) updates.severity = 'major';
    if (!data.type) updates.type = 'compliance_gap';
    if (!data.remediation) updates.remediation = { type: 'pending' };

    if (Object.keys(updates).length > 0) {
      console.log(`Fixing ticket ${doc.id}...`);
      await doc.ref.update(updates);
    }
  }

  // 2. Clean up Policies
  const policySnap = await accreditationDb.collection('policies').get();
  console.log(`Checking ${policySnap.docs.length} policies...`);
  
  for (const doc of policySnap.docs) {
    const data = doc.data();
    const updates: any = {};
    
    if (!data.checks) updates.checks = [];
    if (!data.implementationGuide) updates.implementationGuide = [];
    if (!data.status) updates.status = 'amber';
    if (!data.intensity) updates.intensity = 'soft';

    if (Object.keys(updates).length > 0) {
      console.log(`Fixing policy ${doc.id}...`);
      await doc.ref.update(updates);
    }
  }

  console.log('--- Database Hardening Complete ---');
  process.exit(0);
}

hardenDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
