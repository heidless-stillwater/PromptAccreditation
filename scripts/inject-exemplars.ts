import { accreditationDb } from './src/lib/firebase-admin';

async function main() {
  const policiesRef = accreditationDb.collection('policies');
  
  // 1. DPIA Exemplar for DPA
  const dpaRef = policiesRef.doc('data-protection-act');
  const dpa: any = (await dpaRef.get()).data();
  if (dpa && dpa.implementationGuide && dpa.implementationGuide[0]) {
    dpa.implementationGuide[0].exemplar = `## EXEMPLAR: SecureFlow DPIA (v1.2)

**App Name:** SecureFlow
**Stack:** Next.js, Firebase Auth, Firestore

### 1. Processing Description
SecureFlow processes email addresses and creative assets (PDF/PNG) to facilitate project management. Data is stored in Firestore with regional hosting in europe-west2 (London).

### 2. Necessity & Proportionality
- **Email:** Required for account identity (Contractual basis).
- **Usage Logs:** Collected for performance monitoring (Legitimate interest).

### 3. Risk Assessment
- **Risk:** Unauthorised access to sensitive project files.
- **Mitigation:** Firestore Security Rules enforce UID-level access. AES-256 encryption at rest.`;
  }
  
  // 2. Risk Assessment Exemplar for OSA
  const osaRef = policiesRef.doc('online-safety-act');
  const osa: any = (await osaRef.get()).data();
  if (osa && osa.implementationGuide && osa.implementationGuide[0]) {
    osa.implementationGuide[0].exemplar = `## EXEMPLAR: SecureFlow Children's Risk Assessment

**Target Group:** 13-17 year old student designers.

### Potential Harms
- Unwanted contact from non-collaborators.
- Exposure to inappropriate project briefs.

### Mitigations
- **AV Gateway:** Self-declaration for adult accounts; parent-verified for minors.
- **Moderation:** AI screening on project descriptions using Gemini 1.5 Flash.`;
  }
  
  // 3. ToS Exemplar for OSA
  if (osa && osa.implementationGuide) {
    const tosStep = osa.implementationGuide.find((s: any) => s.id === 'osa-step-5');
    if (tosStep) {
      tosStep.exemplar = `## EXEMPLAR: SecureFlow Terms of Service (OSA Clause)

### 8. PROTECTING YOUNGER USERS
SecureFlow is a professional tool. Users under 18 must have permission from a guardian. We employ automated moderation and manual reporting to ensure the safety of our workspace.

### 12. CONTENT GOVERNANCE
Illegal content is strictly prohibited. We use automated tools to flag harmful material. Removals are processed within 24 hours.`;
    }
  }

  if (dpa) await dpaRef.update({ implementationGuide: dpa.implementationGuide });
  if (osa) await osaRef.update({ implementationGuide: osa.implementationGuide });
  console.log('Injected reference exemplars for SecureFlow');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
