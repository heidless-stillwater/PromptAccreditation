import { accreditationDb } from '../lib/firebase-admin';

async function seedExemplars() {
  console.log('🌱 Seeding Exemplar Compliance Tickets...');

  const exemplars = [
    {
      policyId: 'online-safety',
      checkId: 'safety-report-1',
      status: 'open',
      priority: 'high',
      title: 'Safety Gateway Bypass Detected',
      description: 'Heuristic analysis suggests users are bypassing the Age Verification gateway via deep-links. "Active Fix" will redeploy a middleware-level redirect lock across the entire suite.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      policyId: 'data-protection',
      checkId: 'dpa-audit-1',
      status: 'open',
      priority: 'medium',
      title: '2025 Privacy Policy Refresh',
      description: 'The global Privacy Policy document does not reflect the new UK-GDPR amendments. This requires a manual evidence upload of the signed-off legal text.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      policyId: 'site-security',
      checkId: 'hardening-ssl',
      status: 'open',
      priority: 'high',
      title: 'SSL Certificate Expiration (30d)',
      description: 'The primary SSL certificate for the ecosystem is set to expire in 30 days. Automated renewal check failed.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      policyId: 'online-safety',
      checkId: 'ai-labeling',
      status: 'open',
      priority: 'low',
      title: 'Missing AI Disclosure Labels',
      description: 'Generated assets in PromptTool are missing the mandatory "AI Generated" visual watermarks required by Section 4 of the Safety Act.',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      policyId: 'data-protection',
      checkId: 'dpa-encryption',
      status: 'open',
      priority: 'medium',
      title: 'User Portability Endpoint Audit',
      description: 'The automated check failed to verify the "Request My Data" export functionality in the Master Registry.',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const ticket of exemplars) {
    await accreditationDb.collection('tickets').add(ticket);
    console.log(`✅ Ticket Created: ${ticket.title}`);
  }

  console.log('🚀 Exemplar Seeding Complete!');
  process.exit(0);
}

seedExemplars().catch(console.error);
