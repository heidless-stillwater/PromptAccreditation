import { accreditationDb } from './src/lib/firebase-admin';

async function main() {
  // Update DPA
  const dpaRef = accreditationDb.collection('policies').doc('data-protection-act');
  const dpaSnap = await dpaRef.get();
  if (dpaSnap.exists) {
    const dpa: any = dpaSnap.data();
    if (dpa.implementationGuide && dpa.implementationGuide[0]) {
      dpa.implementationGuide[0].title = 'Data Processing Impact Assessment (DPIA)';
      dpa.implementationGuide[0].description = 'Formal assessment of data processing risks and mitigations';
      dpa.implementationGuide[0].guidance = 'Evaluate the necessity and proportionality of processing operations under UK GDPR.';
      dpa.implementationGuide[0].draftable = true;
      dpa.implementationGuide[0].evidenceRequired = true;
      await dpaRef.update({ implementationGuide: dpa.implementationGuide });
      console.log('Fixed DPA Step 1 Title');
    }
  }

  // Update OSA
  const osaRef = accreditationDb.collection('policies').doc('online-safety-act');
  const osaSnap = await osaRef.get();
  if (osaSnap.exists) {
    const osa: any = osaSnap.data();
    if (!osa.implementationGuide.some((s: any) => s.id === 'osa-step-5')) {
      osa.implementationGuide.push({
        id: 'osa-step-5',
        order: 5,
        title: 'Terms of Service Harmonization',
        description: 'Draft OSA-compliant user agreements',
        guidance: 'Update ToS to include age restrictions and moderation disclosures as required by Ofcom.',
        instructions: '## ToS Update Strategy\n\n1. Use AI to draft compliant clauses\n2. Highlight age verification gateways\n3. Disclose automated moderation processes',
        draftable: true,
        evidenceRequired: true,
        status: 'locked'
      });
      await osaRef.update({ implementationGuide: osa.implementationGuide });
      console.log('Added OSA TOS Step');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
