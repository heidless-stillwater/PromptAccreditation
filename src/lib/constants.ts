import { Policy } from './types';

// ═══════════════════════════════════════════════════════
// INITIAL POLICY SEED DATA
// Run src/scripts/seed-policies.ts to populate DB
// ═══════════════════════════════════════════════════════

export const INITIAL_POLICIES: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ────────────────────────────────────────────────────
  // 1. ONLINE SAFETY ACT 2023
  // ────────────────────────────────────────────────────
  {
    slug: 'online-safety-act',
    name: 'Online Safety Act 2023',
    category: 'safety',
    regulatoryBody: 'Ofcom',
    maxPenalty: '£18M or 10% of global annual turnover',
    legislativeUrl: 'https://www.legislation.gov.uk/ukpga/2023/50',
    status: 'red',
    intensity: 'soft',
    targetApps: ['promptresources', 'prompttool'],
    definition:
      'The Online Safety Act 2023 places a duty of care on providers of user-to-user services and search engines. Services must take proactive steps to protect users from illegal content and, for larger platforms, from legal but harmful content. Age appropriateness and effective age verification are core requirements for services accessible to children.',
    checksAndBalances:
      'Age Verification (AV) gateway with configurable intensity (Soft → Systemic). Content moderation tooling with automated flagging. Transparency reports. Nominated Senior Manager accountability. Ofcom-compliant Terms of Service. Risk assessments refreshed annually.',
    risksAndConsequences:
      'Non-compliance may result in Ofcom enforcement notices, fines up to £18M or 10% of global turnover, and in severe cases, service disruption orders. Criminal liability may attach to nominated Senior Managers. Reputational damage from public enforcement action is significant.',
    implementationGuide: [
      {
        id: 'osa-step-1',
        order: 1,
        title: 'Risk Assessment',
        description: 'Conduct and document a Children\'s Risk Assessment',
        guidance: 'Ofcom requires all in-scope services to complete a Children\'s Risk Assessment before implementing age verification. This must identify how the service could be accessed by children and what harms they may encounter.',
        instructions: `## Children's Risk Assessment

### What you need to do
1. Identify all user journeys where children could access content
2. Classify content types present on the platform (UGC, curated, AI-generated)
3. Assess likelihood of children accessing each content category
4. Document mitigations for each identified risk
5. Record the assessment with date and responsible Senior Manager signature

### Evidence Required
- Completed risk assessment document (PDF)
- Sign-off from nominated Senior Manager

### Ofcom Guidance
See: [Ofcom Children's Risk Assessment Guidance](https://www.ofcom.org.uk/online-safety/information-for-industry/guidance-for-services)`,
        evidenceRequired: true,
        automatable: false,
        estimatedMinutes: 60,
        status: 'active',
        draftable: true,
        relatedCheckId: 'osa-risk-assessment',
      },
      {
        id: 'osa-step-2',
        order: 2,
        title: 'Age Verification Strategy',
        description: 'Select and document your AV approach',
        guidance: 'Choose the AV intensity appropriate to your risk assessment. Soft = self-declaration, Hard = DOB validation with session gate. Document your rationale.',
        instructions: `## Age Verification Strategy Selection

### Intensity Options
| Level | Method | Dial Position |
|:--|:--|:--|
| **Soft** | Self-declaration checkbox | Soft |
| **Standard** | Date of birth picker + session cookie | Hard |
| **Full ID** | Third-party ID verification (Yoti, ACCS) | Systemic |

### Recommended Approach
For most SaaS platforms: **Standard (Hard)** — DOB picker with JS validation.

### Steps
1. Use the Intensity Dial on the policy card to select your approach
2. Document your rationale referencing your risk assessment
3. Upload evidence of the strategy decision`,
        evidenceRequired: true,
        automatable: false,
        estimatedMinutes: 30,
        dependsOn: ['osa-step-1'],
        status: 'locked',
        relatedCheckId: 'osa-toc',
      },
      {
        id: 'osa-step-3',
        order: 3,
        title: 'Implement AV Gateway',
        description: 'Deploy the AV component to user-facing apps',
        guidance: 'The AV gateway must gate access before any user-generated or AI-generated content is displayed.',
        instructions: `## Implementing the AV Gateway

### What to Build
A client-side component that:
1. Checks for a valid age-verification session cookie
2. If absent, shows a DOB picker modal
3. Validates age ≥ 18
4. Sets a session cookie on success
5. Redirects to the content only after verification

### Active Controller Fix
Click "Active Fix" to push \`avEnabled: true\` and \`avStrictness: "hard"\` to PromptResources system_config.

### Verifying
Use the "Run Check" button to probe PromptResources automatically.`,
        evidenceRequired: true,
        automatable: true,
        automatedProbeId: 'probe-av-gateway',
        estimatedMinutes: 120,
        dependsOn: ['osa-step-2'],
        status: 'locked',
        relatedCheckId: 'probe-av-gateway',
      },
      {
        id: 'osa-step-4',
        order: 4,
        title: 'Content Moderation',
        description: 'Verify content moderation tooling is active',
        guidance: 'Ensure flagging, reporting, and removal workflows are documented and operational.',
        instructions: `## Content Moderation Verification

### Required Controls
1. User reporting mechanism (flag button on content)
2. Automated AI content screening (where applicable)
3. Human review queue for flagged content
4. Documented removal SLA (e.g., ≤24h for illegal content)

### Active Controller Fix
Click "Active Fix" to activate automated flagging and AI screening in PromptResources.

### Evidence
Upload your content moderation policy document.`,
        evidenceRequired: true,
        automatable: true,
        relatedCheckId: 'probe-content-moderation',
        automatedProbeId: 'probe-content-moderation',
        estimatedMinutes: 45,
        dependsOn: ['osa-step-3'],
        status: 'locked',
      },
    ],
    checks: [
      {
        id: 'probe-av-gateway',
        title: 'Age Verification Gateway Active',
        description: 'AV config present in PromptResources system_config',
        status: 'red',
        category: 'automated',
        probeId: 'probe-av-gateway',
        targetApp: 'promptresources',
        targetDb: 'promptresources-db-0',
        lastChecked: null,
      },
      {
        id: 'probe-content-moderation',
        title: 'Content Moderation Policy',
        description: 'Content moderation config active in PromptResources',
        status: 'red',
        category: 'hybrid',
        probeId: 'probe-content-moderation',
        targetApp: 'promptresources',
        targetDb: 'promptresources-db-0',
        lastChecked: null,
      },
      {
        id: 'osa-risk-assessment',
        title: "Children's Risk Assessment",
        description: 'Documented risk assessment on file',
        status: 'red',
        category: 'manual',
        targetApp: 'all',
        lastChecked: null,
      },
      {
        id: 'osa-toc',
        title: 'Compliant Terms of Service',
        description: 'ToS references OSA obligations and age restrictions',
        status: 'amber',
        category: 'manual',
        targetApp: 'all',
        lastChecked: null,
      },
    ],
  },

  // ────────────────────────────────────────────────────
  // 2. DATA PROTECTION ACT 2018 (UK GDPR)
  // ────────────────────────────────────────────────────
  {
    slug: 'data-protection-act',
    name: 'Data Protection Act 2018 (UK GDPR)',
    category: 'data',
    regulatoryBody: 'Information Commissioner\'s Office (ICO)',
    maxPenalty: '£17.5M or 4% of global annual turnover',
    legislativeUrl: 'https://www.legislation.gov.uk/ukpga/2018/12',
    status: 'amber',
    intensity: 'soft',
    targetApps: ['promptresources', 'prompttool', 'promptmaster'],
    definition:
      'The Data Protection Act 2018 incorporates the UK GDPR post-Brexit. It governs the collection, storage, processing, and transfer of personal data. Organisations must demonstrate lawful basis for processing, honour data subject rights (access, erasure, portability), and implement appropriate technical/organisational security measures.',
    checksAndBalances:
      'Encryption at rest and in transit enforced. Data retention policies implemented. Subject access request (SAR) workflow documented. Privacy policy and cookie consent up to date. Data Processing Agreements (DPAs) with third-party processors. Breach notification within 72 hours of ICO.',
    risksAndConsequences:
      'ICO enforcement notices, fines up to £17.5M or 4% of global turnover, mandatory audits, reputational damage. Data subjects may seek compensation. Criminal liability for deliberate misuse of personal data.',
    implementationGuide: [
      {
        id: 'dpa-step-1',
        order: 1,
        title: 'Data Audit & Mapping',
        description: 'Identify all personal data processed',
        guidance: 'Document what data you collect, why, where it is stored, and who has access.',
        instructions: `## Data Audit

### Create a Data Map
| Data Type | Purpose | Lawful Basis | Location | Retention |
|:--|:--|:--|:--|:--|
| Email address | Authentication | Contract | Firestore users/ | Account lifetime |
| Usage logs | Analytics | Legitimate interest | Firestore | 90 days |
| Payment info | Subscription | Contract | Stripe (never stored locally) | Per Stripe policy |

### Evidence Required
- Completed data map document (CSV or PDF)`,
        evidenceRequired: true,
        automatable: false,
        estimatedMinutes: 90,
        status: 'active',
        draftable: true,
        relatedCheckId: 'probe-data-audit',
      },
      {
        id: 'dpa-step-2',
        order: 2,
        title: 'Encryption Enforcement',
        description: 'Verify encryption at rest and in transit',
        guidance: 'Firebase/Firestore encrypts at rest by default. Enforce HTTPS. Verify sensitive fields use application-level encryption where required.',
        instructions: `## Encryption Verification

### What to Check
1. **In Transit:** All endpoints use HTTPS (TLS 1.2+)
2. **At Rest:** Firestore default encryption enabled (automatic in GCP)
3. **Application Level:** API keys/secrets encrypted with AES-256-GCM
4. **Passwords:** Never stored plaintext (Firebase Auth handles this)

### Active Controller Fix
Click "Active Fix" to push \`encryptionForced: true\` to Master Registry config.`,
        evidenceRequired: false,
        automatable: true,
        automatedProbeId: 'probe-encryption-enforcement',
        estimatedMinutes: 30,
        dependsOn: ['dpa-step-1'],
        status: 'locked',
        relatedCheckId: 'probe-encryption-enforcement',
      },
      {
        id: 'dpa-step-3',
        order: 3,
        title: 'Privacy Policy & Cookie Consent',
        description: 'Ensure Privacy Policy is UK GDPR compliant',
        guidance: 'Privacy Policy must be publicly accessible, written in plain English, and cover all required UK GDPR elements.',
        instructions: `## Privacy Policy Checklist

### Required Elements
- [ ] Data controller identity and contact details
- [ ] DPO contact (if applicable)
- [ ] Categories of personal data collected
- [ ] Lawful basis for each processing activity
- [ ] Retention periods
- [ ] Data subject rights and how to exercise them
- [ ] Third-party data sharing
- [ ] International transfers (if any)
- [ ] Right to lodge a complaint with ICO

### Evidence
Link to your live Privacy Policy URL.`,
        evidenceRequired: true,
        automatable: false,
        estimatedMinutes: 60,
        dependsOn: ['dpa-step-2'],
        status: 'locked',
        relatedCheckId: 'dpa-privacy-policy',
      },
    ],
    checks: [
      {
        id: 'probe-encryption-enforcement',
        title: 'Encryption Enforced in Master Registry',
        description: 'encryptionForced flag set in system_settings/compliance',
        status: 'amber',
        category: 'automated',
        probeId: 'probe-encryption-enforcement',
        targetApp: 'promptmaster',
        targetDb: 'promptmaster-db-0',
        lastChecked: null,
      },
      {
        id: 'probe-data-audit',
        title: 'Audit Logging Active',
        description: 'Data access audit logging enabled',
        status: 'red',
        category: 'automated',
        probeId: 'probe-data-audit',
        targetApp: 'promptmaster',
        targetDb: 'promptmaster-db-0',
        lastChecked: null,
      },
      {
        id: 'dpa-privacy-policy',
        title: 'Privacy Policy Published',
        description: 'UK GDPR compliant privacy policy accessible',
        status: 'amber',
        category: 'manual',
        targetApp: 'all',
        lastChecked: null,
      },
    ],
  },

  // ────────────────────────────────────────────────────
  // 3. SITE SECURITY
  // ────────────────────────────────────────────────────
  {
    slug: 'site-security',
    name: 'Site Security Policy',
    category: 'security',
    regulatoryBody: 'NCSC / Internal',
    maxPenalty: 'Breach liability, regulatory notification obligations',
    status: 'amber',
    intensity: 'soft',
    targetApps: ['promptresources', 'prompttool', 'promptmaster'],
    definition:
      'Technical security hardening requirements for all applications in the Prompt Suite. Covers HTTPS enforcement, HTTP security headers, Firestore security rules, API key management, and dependency vulnerability management. Aligned with NCSC Cyber Essentials framework.',
    checksAndBalances:
      'HTTPS enforced across all apps. Security headers (HSTS, CSP, X-Frame-Options, etc.) configured. Firestore security rules deny unauthenticated write access. API secrets stored encrypted in centralised secret store. Dependency scanning in CI pipeline.',
    risksAndConsequences:
      'Security breaches leading to data exposure trigger DPA breach notification obligations (72h to ICO). Customer trust damage. Potential liability for consequential losses. Denial of service if vulnerabilities are exploited.',
    implementationGuide: [
      {
        id: 'sec-step-1',
        order: 1,
        title: 'HTTPS Enforcement',
        description: 'Verify all apps are served over HTTPS only',
        guidance: 'No HTTP endpoints should be accessible. Redirect all HTTP to HTTPS.',
        instructions: `## HTTPS Enforcement

### Verification Steps
1. Check Firebase Hosting / Cloud Run config enforces HTTPS
2. Verify next.config.js or headers config includes HSTS
3. Test with: \`curl -I http://your-app.web.app\` — should redirect 301

### HSTS Header
Add to Next.js config:
\`\`\`js
headers: [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
\`\`\``,
        evidenceRequired: false,
        automatable: true,
        automatedProbeId: 'probe-security-headers',
        estimatedMinutes: 30,
        status: 'active',
        relatedCheckId: 'probe-security-headers',
      },
      {
        id: 'sec-step-2',
        order: 2,
        title: 'Security Headers',
        description: 'Configure HTTP security response headers',
        guidance: 'Add CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy to all app responses.',
        instructions: `## Security Headers Configuration

### Required Headers
| Header | Value | Purpose |
|:--|:--|:--|
| Strict-Transport-Security | max-age=63072000 | Force HTTPS |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Limit referrer leakage |
| Content-Security-Policy | default-src 'self' | Prevent XSS |

### Next.js Implementation
Add to \`next.config.js\` headers() function.

### Active Controller Fix
Click "Active Fix" to push security header config to all apps' system_config/security in Firestore.`,
        evidenceRequired: false,
        automatable: true,
        automatedProbeId: 'probe-security-headers',
        estimatedMinutes: 45,
        dependsOn: ['sec-step-1'],
        status: 'locked',
        relatedCheckId: 'probe-security-headers',
      },
      {
        id: 'sec-step-3',
        order: 3,
        title: 'Firestore Security Rules Audit',
        description: 'Review and harden Firestore security rules',
        guidance: 'Ensure no collection allows unauthenticated writes. Admin-only collections must check for admin role claim.',
        instructions: `## Firestore Rules Audit

### Minimum Requirements
1. All writes require \`request.auth != null\`
2. Admin collections require \`request.auth.token.role == 'admin'\`
3. User data scoped to \`request.auth.uid\`

### Upload Evidence
Upload a screenshot or export of your current firestore.rules for each app.`,
        evidenceRequired: true,
        automatable: false,
        estimatedMinutes: 60,
        dependsOn: ['sec-step-2'],
        status: 'locked',
      },
    ],
    checks: [
      {
        id: 'probe-security-headers',
        title: 'Security Headers Configured',
        description: 'Security headers config present in PromptTool system_config',
        status: 'amber',
        category: 'automated',
        probeId: 'probe-security-headers',
        targetApp: 'prompttool',
        targetDb: 'prompttool-db-0',
        lastChecked: null,
      },
      {
        id: 'sec-https',
        title: 'HTTPS Enforced',
        description: 'All apps served over HTTPS with HSTS',
        status: 'amber',
        category: 'manual',
        targetApp: 'all',
        lastChecked: null,
      },
      {
        id: 'sec-firestore-rules',
        title: 'Firestore Rules Hardened',
        description: 'No unauthenticated write access to any collection',
        status: 'amber',
        category: 'manual',
        targetApp: 'all',
        lastChecked: null,
      },
      {
        id: 'sec-secrets',
        title: 'Secrets Management',
        description: 'All API keys use encrypted central secret store',
        status: 'green',
        category: 'automated',
        targetApp: 'all',
        lastChecked: null,
        notes: 'AES-256-GCM secret store confirmed active via config-helper.ts',
      },
    ],
  },
  // ────────────────────────────────────────────────────
  // 4. EU AI ACT (Transparency & Bias) — [PLANNED]
  // ────────────────────────────────────────────────────
  {
    slug: 'eu-ai-act',
    name: 'EU AI Act (Transparency & Bias)',
    category: 'safety',
    regulatoryBody: 'EU AI Office',
    maxPenalty: '€35M or 7% of global annual turnover',
    legislativeUrl: 'https://artificialintelligenceact.eu/',
    status: 'planned',
    intensity: 'soft',
    targetApps: ['prompttool'],
    definition:
      'The EU AI Act is the first comprehensive legal framework for AI in the world. It follows a risk-based approach, imposing stricter rules on "High-Risk" AI systems. Core requirements include transparency, human oversight, and bias mitigation for generative AI models.',
    checksAndBalances:
      'Algorithmic Impact Assessments. Continuous model drift monitoring. Proactive bias detection and mitigation reports. Human-in-the-loop oversight workflows. Automated technical documentation generation.',
    risksAndConsequences:
      'Fines up to €35M or 7% of global turnover. Market withdrawal of non-compliant AI systems. Severe reputational damage and exclusion from EU public procurement.',
    implementationGuide: [
      {
        id: 'ai-step-1',
        order: 1,
        title: 'Risk Classification',
        description: 'Classify your AI system under EU AI Act tiers',
        guidance: 'Determine if your system is Unacceptable, High-Risk, Limited, or Minimal risk.',
        instructions: 'Evaluate use cases against Annex III. Most PromptTool generations fall under "Limited Risk" requiring transparency.',
        evidenceRequired: true,
        automatable: false,
        status: 'locked',
      }
    ],
    checks: [],
  },
  // ────────────────────────────────────────────────────
  // 5. IP & LICENSING SOVEREIGNTY — [PLANNED]
  // ────────────────────────────────────────────────────
  {
    slug: 'ip-governance',
    name: 'IP & Licensing Sovereignty',
    category: 'data',
    regulatoryBody: 'Internal Governance / WIPO',
    maxPenalty: 'Civil liability, removal of infringing content',
    status: 'planned',
    intensity: 'soft',
    targetApps: ['promptresources', 'prompttool'],
    definition:
      'Ensures that all AI-generated output and training inputs are compliant with global Intellectual Property laws. Covers provenance tracking, licensing attribution, and copyright-safe generation guards.',
    checksAndBalances:
      'Training data provenance registry. Output attribution watermarking. Automated licensing audits for third-party LLM providers.',
    risksAndConsequences:
      'Copyright infringement lawsuits. Loss of IP rights for generated content. Platform-wide takedown notices.',
    implementationGuide: [],
    checks: [],
  },
  // ────────────────────────────────────────────────────
  // 6. SOVEREIGN DATA RESIDENCY — [PLANNED]
  // ────────────────────────────────────────────────────
  {
    slug: 'data-residency',
    name: 'Sovereign Data Residency',
    category: 'data',
    regulatoryBody: 'ICO / Host Jurisdictions',
    maxPenalty: 'GDPR fines for illegal international transfers',
    status: 'planned',
    intensity: 'hard',
    targetApps: ['promptresources', 'promptmaster'],
    definition:
      'Enforces strict geographic boundaries on where personal data is stored and processed. Ensures compliance with "Local Data" requirements for Government and Healthcare sectors.',
    checksAndBalances:
      'Geofencing for database shards. Cloud region verification probes. Automated encryption for cross-border transit.',
    risksAndConsequences:
      'Immediate suspension of international data transfer agreements. Regulatory fines for jurisdictional leakage.',
    implementationGuide: [],
    checks: [],
  },
  // ────────────────────────────────────────────────────
  // 7. AI ACCESSIBILITY (WCAG 2.1) — [PLANNED]
  // ────────────────────────────────────────────────────
  {
    slug: 'accessibility',
    name: 'AI Accessibility (WCAG 2.1)',
    category: 'security',
    regulatoryBody: 'Accessibility Standards Board',
    maxPenalty: 'Legal action under Equality Acts',
    status: 'planned',
    intensity: 'soft',
    targetApps: ['all'],
    definition:
      'Governance framework to ensure that AI-driven interfaces are accessible to all users, including those with disabilities. Aligned with WCAG 2.1 Level AA.',
    checksAndBalances:
      'Automated accessibility scanning. Screen reader compatibility checks for AI outputs. High-contrast and keyboard navigation verification.',
    risksAndConsequences:
      'Exclusion of user groups. Regulatory audits for digital discrimination. Litigation risks.',
    implementationGuide: [],
    checks: [],
  },
];

// App suite registry
export const SUITE_APPS = [
  { id: 'prompttool',  name: 'PromptTool',      dbId: 'prompttool-db-0',      port: 3001 },
  { id: 'promptresources', name: 'PromptResources', dbId: 'promptresources-db-0', port: 3002 },
  { id: 'promptmaster', name: 'PromptMasterSPA', dbId: 'promptmaster-db-0',    port: 5173 },
  { id: 'promptaccreditation', name: 'PromptAccreditation', dbId: 'promptaccreditation-db-0', port: 3000 },
];

export const STRIPE_PRODUCTS = {
  professional: { name: 'Accreditation Professional', price: 2900 },
  enterprise: { name: 'Accreditation Enterprise', price: 9900 },
};
