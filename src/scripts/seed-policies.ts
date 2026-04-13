import { accreditationDb } from '../lib/firebase-admin';

const policies = [
    {
        id: 'online-safety',
        name: 'Online Safety Act 2023',
        slug: 'online-safety-act',
        regulatoryBody: 'Ofcom',
        maxPenalty: '£18M or 10% of global revenue',
        category: 'Legal/Safety',
        status: 'amber',
        intensity: 'soft',
        definition: 'UK legislation requiring online services to protect users (especially children) from harmful content. Mandates highly effective age verification.',
        checksAndBalances: 'Age Verification gateways, content moderation flags, and transparency reporting.',
        risksAndConsequences: 'Massive financial penalties, service blocking in the UK, and criminal liability for senior managers.',
        checks: [
            { id: 'av-deployed', title: 'Age Verification Gateway Deployed', status: 'green', category: 'automated' },
            { id: 'av-accuracy', title: 'AV Method Accuracy Audit', status: 'amber', category: 'manual' },
            { id: 'children-risk-assess', title: 'Childrens Access Risk Assessment', status: 'red', category: 'manual' },
            { id: 'user-reporting-live', title: 'User Reporting Mechanism Live', status: 'green', category: 'automated' }
        ],
        implementationGuide: [
            { id: 'step-1', order: 1, title: 'Scope Assessment', description: 'Determine if apps are "likely to be accessed by children".', guidance: 'Check user demographics in PromptResources analytics.', evidenceRequired: true, automatable: false },
            { id: 'step-2', order: 2, title: 'Deploy AV Gate', description: 'Implement age verification on restricted resources.', guidance: 'Trigger the AV flag in PromptResources config.', evidenceRequired: false, automatable: true }
        ]
    },
    {
        id: 'data-protection',
        name: 'Data Protection Act 2018',
        slug: 'data-protection-act',
        regulatoryBody: 'ICO',
        maxPenalty: '£17.5M or 4% of global turnover',
        category: 'Legal/Privacy',
        status: 'red',
        intensity: 'soft',
        definition: 'UK implementation of GDPR. Governs the collection, storage, and processing of personal data.',
        checksAndBalances: 'Privacy policies, consent management, data encryption, and subject rights workflows.',
        risksAndConsequences: 'ICO enforcement notices, heavy fines, and loss of user trust.',
        checks: [
            { id: 'privacy-policy-published', title: 'Privacy Policy Published', status: 'green', category: 'automated' },
            { id: 'encryption-enforced', title: 'Data Encryption Enforced', status: 'red', category: 'automated' },
            { id: 'ropa-maintained', title: 'Record of Processing Activities', status: 'red', category: 'manual' },
            { id: 'dsr-workflow', title: 'Data Subject Rights Workflow', status: 'amber', category: 'hybrid' }
        ],
        implementationGuide: [
            { id: 'dpa-step-1', order: 1, title: 'Data Audit', description: 'Map all personal data flows in the suite.', guidance: 'Identify where emails and prompts are stored.', evidenceRequired: true, automatable: false }
        ]
    },
    {
        id: 'site-security',
        name: 'Site Security',
        slug: 'site-security',
        regulatoryBody: 'Internal/OWASP',
        maxPenalty: 'Service Compromise / Data Breach',
        category: 'Technical/Security',
        status: 'green',
        intensity: 'hard',
        definition: 'Technical measures to protect the App Suite from unauthorized access, breaches, and service disruption.',
        checksAndBalances: 'HTTPS enforcement, security headers, CORS config, and 2FA for admin access.',
        risksAndConsequences: 'Data exposure, service compromise, and compounding regulatory violations.',
        checks: [
            { id: 'https-only', title: 'HTTPS Enforcement', status: 'green', category: 'automated' },
            { id: 'security-headers', title: 'Security Headers Audit', status: 'green', category: 'automated' },
            { id: 'admin-2fa', title: 'Admin 2FA Active', status: 'green', category: 'manual' }
        ],
        implementationGuide: [
            { id: 'sec-step-1', order: 1, title: 'Header Lockdown', description: 'Configure CSP, HSTS, and X-Frame-Options.', guidance: 'Update next.config.ts headers.', evidenceRequired: false, automatable: true }
        ]
    }
];

async function seed() {
    console.log('🌱 Seeding Compliance Policies...');
    for (const policy of policies) {
        await accreditationDb.collection('policies').doc(policy.id).set({
            ...policy,
            updatedAt: new Date()
        });
        console.log(`✅ Seeded Policy: ${policy.name}`);
    }
    console.log('🏁 Seeding Complete.');
}

seed().catch(err => {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
});
