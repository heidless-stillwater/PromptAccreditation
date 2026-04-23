/**
 * Sovereign Ingestion Script — Ingests high-fidelity regulatory grounding data.
 * Run with: npx tsx src/scripts/ingest-regulatory-baseline.ts
 */
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly for secrets
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { KBService } from '../lib/services/kb-service';

const REGULATORY_DATA = [
  {
    title: 'EU AI Act: Transparency & GPAI (Articles 52 & 53)',
    category: 'safety' as const,
    content: `
# EU AI Act — Transparency Obligations (Article 52)
Article 52 establishes requirements for specific AI systems to ensure users are aware when they interact with AI.
- **Interaction (Art 52.1):** Providers must design AI systems so users are informed they are interacting with an AI (e.g., chatbots like PromptTool's assistant).
- **AI-Generated Content (Art 52.3):** Deployers of AI systems that generate or manipulate text, audio, or visual content (deepfakes) must disclose that the content was artificially generated.
- **Exceptions:** Does not apply to systems authorized by law for criminal investigations or where the AI is performing a minor assistive role.

# EU AI Act — General-Purpose AI (Article 53)
Providers of General-Purpose AI (GPAI) models must:
1. **Technical Documentation:** Maintain documentation on training and testing processes (Annex XI).
2. **Downstream Info:** Provide information to downstream deployers to help them meet compliance (Annex XII).
3. **Copyright Policy:** Implement a policy to respect EU copyright law and Article 4(3) of the CDSM Directive (opt-out mechanisms).
4. **Training Summary:** Publish a detailed summary of content used for model training.
    `.trim(),
  },
  {
    title: 'UK Online Safety Act: Illegal Content & HEAA',
    category: 'safety' as const,
    content: `
# UK Online Safety Act — Illegal Content Duties
Services have a legal duty to prevent users from encountering illegal content (terrorism, self-harm, CSEA).
- **Detection & Removal:** Providers must implement robust systems to detect and take down illegal content swiftly.
- **Penalties:** Ofcom can fine companies up to 10% of global annual turnover or £18 million for non-compliance.

# UK Online Safety Act — Highly Effective Age Assurance (HEAA)
For services hosting "primary priority content" (unsuitable for children):
- **Mandatory Duty:** Use "Highly Effective Age Assurance" (HEAA) to prevent children from accessing restricted areas.
- **Acceptable Methods:** Facial age estimation, ID document verification, or reusable digital IDs. Self-declaration (e.g., "I am 18") is NOT considered highly effective.
    `.trim(),
  },
  {
    title: 'IP Sovereignty: Training Data & CDSM Article 4(3)',
    category: 'data' as const,
    content: `
# IP & Licensing Sovereignty — Grounding
Ensures AI generation and inputs are compliant with Global IP laws.
- **CDSM Directive (Article 4.3):** Rights holders can "opt-out" of text and data mining (TDM) using machine-readable means (e.g., robots.txt or metadata).
- **Provenance Tracking:** Sovereign systems must maintain logs of training data sources and licensing agreements to mitigate copyright liability (e.g., The New York Times v. OpenAI).
- **Attribution:** AI-generated outputs should ideally carry attribution metadata where provenance is tracked to specific datasets.
    `.trim(),
  },
  {
    title: 'AI Accessibility: WCAG 2.1 & POUR Principles',
    category: 'security' as const, // Category for UI/Security hardening
    content: `
# AI Accessibility (WCAG 2.1 Level AA)
AI-driven interfaces must follow the POUR principles (Perceivable, Operable, Understandable, Robust).
- **Status Messages (SC 4.1.3):** Chatbot responses that stream dynamically must be announced by assistive technology (e.g., aria-live) without moving focus.
- **Keyboard Accessibility (SC 2.1.1):** All AI controls and chat inputs must be fully operable via keyboard only (no keyboard traps).
- **Contrast (SC 1.4.3):** AI text and UI components must meet minimum contrast ratios (4.5:1 for text).
- **Name/Role/Value (SC 4.1.2):** All interactive AI components must have correctly defined ARIA roles.
    `.trim(),
  }
];

async function ingest() {
  console.log('🏛️  Initiating Sovereign Knowledge Ingestion...\n');
  
  const actor = 'Sovereign_Admin_Node';
  
  for (const item of REGULATORY_DATA) {
    try {
      const docId = await KBService.chunkAndEmbed(
        item.title,
        item.content,
        item.category,
        actor
      );
      console.log(`  ✅ Ingested: ${item.title} (ID: ${docId})`);
    } catch (err) {
      console.error(`  ❌ Failed: ${item.title}`, err);
    }
  }

  console.log('\n✨ Knowledge Base Hardened.');
  process.exit(0);
}

ingest().catch(err => {
  console.error('❌ Ingestion Error:', err);
  process.exit(1);
});
