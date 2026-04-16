import { PolicyService } from './policy-service';
import { getGemini, MODELS } from '@/lib/gemini';
import { accreditationDb } from '@/lib/firebase-admin';

export interface DraftResult {
  content: string;
  checklist: string;
}

export class EvidenceService {
  /**
   * Verifies the provided evidence using the LLM.
   */
  async verifyEvidence(policyId: string, checkId: string, evidenceUrl: string): Promise<{ verified: boolean; reasoning: string }> {
    const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
    if (!policy) throw new Error('Policy not found');

    const check = policy.checks.find(c => c.id === checkId);
    if (!check) throw new Error('Check not found');

    const genai = await getGemini() as any;
    
    const prompt = `You are a professional IT Auditor.
    POLICY: ${policy.name}
    CONTROL: ${check.title}
    REQUIREMENT: ${check.description}
    EVIDENCE PROVIDED: ${evidenceUrl}

    Evaluate compliance. Respond only with JSON:
    { "verified": true/false, "reasoning": "..." }`;

    try {
      const result = await genai.models.generateContent({
        model: MODELS.FLASH,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(rawText || '{}');
    } catch (error) {
      return { verified: false, reasoning: 'Audit system timeout.' };
    }
  }

  /**
   * Auto-drafts compliance evidence.
   */
  async draftEvidence(
    policyId: string,
    stepId: string,
    userId: string,
    context?: any
  ): Promise<{ content: string; checklist: string }> {
    try {
      console.log(`[EvidenceService] Synthesize starting: ${policyId} / ${stepId}`);
      const policy = await PolicyService.getPolicyById(policyId) || await PolicyService.getPolicyBySlug(policyId);
      if (!policy) {
        console.error(`[EvidenceService] Policy not found for identifier: ${policyId}`);
        throw new Error('Policy context missing');
      }

      const step = policy.implementationGuide.find(s => s.id === stepId);
      if (!step) {
        console.error(`[EvidenceService] Step not found in policy: ${stepId}. Available:`, policy.implementationGuide.map(s => s.id));
        throw new Error('Step context missing');
      }

      const isPrivacyStep = stepId === 'dpa-step-3';
      const wizardState = await PolicyService.getWizardState(policy.id, userId);
      const dataMap = wizardState?.evidenceUploaded?.['dpa-step-1'] || 'Standard SaaS Data Context';

      const genai = await getGemini() as any;
      const contextString = context 
        ? `Entity: ${context.companyName}, DPO Contact: ${context.dpoEmail}, Jurisdiction: ${context.jurisdiction}`
        : 'Standard SaaS Context';

      const prompt = isPrivacyStep 
        ? `TASK: Drafting a high-fidelity UK GDPR Privacy Policy for the Stillwater SaaS Suite.
           ENTITY_CONTEXT: ${contextString}
           DATA_MAP: ${dataMap}
           OUTPUT: Provide a formal markdown policy and a verification checklist.
           FORMAT: Return JSON { "content": "...", "checklist": "..." }.`
        : `TASK: Drafting technical evidence and implementation roadmap for "${step.title}".
           
           REQUIREMENTS:
           1. Provide a formal markdown document in "content".
           2. Provide a 3-5 item markdown task list in "checklist" using format: "- [ ] [PX] **Unique_Action_Title**: Specific description."
           
           IMPORTANT: Every task MUST have a unique, informative bold title. DO NOT repeat "${step.title}" as the task title.
           
           FORMAT: Return JSON { "content": "...", "checklist": "..." }.`;

      let rawText = '';
      try {
        // Clinical Timeout: 30s to prevent synthesis hang
        const aiPromise = genai.models.generateContent({
          model: MODELS.FLASH,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI_TIMEOUT')), 30000)
        );

        const result = await Promise.race([aiPromise, timeoutPromise]) as any;
        rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err: any) {
        console.warn(`[EvidenceService] Synthesis interrupted: ${err.message}. Engaging Sovereign Fallback.`);
        // Sovereign Catch-All: Always provide a template for critical mission steps on failure
        if (isPrivacyStep) return this.getMockPrivacyPolicy(dataMap);
        if (stepId === 'dpa-step-1') return this.getMockDataAudit();
        if (stepId === 'dpa-step-2') return this.getMockEncryptionEnforcement();
        
        // Online Safety Act Fallbacks
        if (stepId === 'osa-step-1') return this.getMockOSARiskAssessment();
        if (stepId === 'osa-step-2') return this.getMockOSAVersion();
        if (stepId === 'osa-step-3') return this.getMockOSAGateway();
        if (stepId === 'osa-step-4') return this.getMockOSAModeration();

        // Generic Fallback
        return {
          content: `# Technical Implementation Guide: ${step.title}\n\n## 1. Objective\nThis document establishes the implementation baseline for the ${step.title} control within the Stillwater SaaS Suite.\n\n## 2. Requirement\n${step.description}\n\n## 3. Technical Strategy\n1. Review current architecture constraints.\n2. Apply technical patches to satisfy ${step.guidance}.\n3. Verify mission success via the Sovereign Auditor.`,
          checklist: `- [ ] [P1] **${step.id}_Discovery**: Identify assets.\n- [ ] [P2] **Implementation**: Execute the ${step.title} patch.\n- [ ] [P3] **Validation**: Run the automated probe.`
        };
      }

      // Advanced Sovereign Parser
      try {
        const parsed = this.safeJsonParse(rawText);
        // Fallback: If JSON is valid but checklist is empty
        if (!parsed.checklist || parsed.checklist.trim().length === 0) {
           parsed.checklist = `- [ ] [P1] **${step.title}_Scoping**: Initial technical discovery for ${step.title}.\n- [ ] [P2] **Implementation_Logic**: Configuration of the ${step.title} control framework.\n- [ ] [P3] **Verification_Check**: Cross-referencing implementation against Stillwater audit requirements.`;
        }

        // Sovereign Commitment: Persist draft to Mission Registry with Atomic Merging
        const docRef = accreditationDb.collection('wizard_states').doc(`${userId}_${policy.slug}`);
        const docSnap = await docRef.get();
        
        const existingData = docSnap.exists ? docSnap.data() : {};
        const completedSteps = new Set(existingData?.stepsCompleted || []);
        completedSteps.add(stepId);

        if (!docSnap.exists) {
          await docRef.set({
            evidenceUploaded: { [stepId]: parsed.content },
            checklistsUploaded: { [stepId]: parsed.checklist },
            stepsCompleted: Array.from(completedSteps),
            updatedAt: new Date()
          });
        } else {
          await docRef.update({
            [`evidenceUploaded.${stepId}`]: parsed.content,
            [`checklistsUploaded.${stepId}`]: parsed.checklist,
            stepsCompleted: Array.from(completedSteps),
            updatedAt: new Date()
          });
        }

        console.log(`[EvidenceService] Synthesis & Progression committed: ${stepId}`);
        return parsed;
      } catch (e) {
        console.warn('[EvidenceService] Synthesis repair failed. Engaging Sovereign Fallback.');
        
        // Online Safety Act Fallbacks
        if (stepId === 'osa-step-1') return this.getMockOSARiskAssessment();
        if (stepId === 'osa-step-2') return this.getMockOSAVersion();
        if (stepId === 'osa-step-3') return this.getMockOSAGateway();
        if (stepId === 'osa-step-4') return this.getMockOSAModeration();
        
        // Data Protection Act Fallbacks
        if (stepId === 'dpa-step-1') return this.getMockDataAudit();
        if (stepId === 'dpa-step-2') return this.getMockEncryptionEnforcement();
        if (isPrivacyStep) return this.getMockPrivacyPolicy(dataMap);

        throw e;
      }
    } catch (error: any) {
      return {
        content: `Synthesis suspended: ${error.message}. Please click Re-run Synthesis.`,
        checklist: `- [ ] Implementation roadmap temporarily unavailable.`
      };
    }
  }

  private safeJsonParse(raw: string): DraftResult {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON');
    let jsonStr = raw.substring(start, end + 1);
    
    // Step 1: Remove control characters
    jsonStr = jsonStr.replace(/[\u0000-\u001F]/g, "");
    
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Step 2: Aggressive Repair
      // - Escape unescaped backslashes (but not already escaped ones)
      // - Repair illegal newlines
      const repaired = jsonStr
        .replace(/\\(?!["\\\/bfnrtu])/g, "\\\\") // Fix bad escapes
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "")
        .replace(/\t/g, "  ");
      return JSON.parse(repaired);
    }
  }

  private getMockEncryptionEnforcement(): DraftResult {
    return {
      content: `# Technical Enforcement: Field-Level Encryption\n\n## 1. Requirement\nAll sensitive PII fields must be protected using AES-256-GCM. Transit must be enforced via TLS 1.3.\n\n## 2. Technical Fix\nThe "Active Fix" button triggers the forced encryption flag in the Master Registry. This ensures that all Prompt Suite apps adopt the clinical baseline.\n\n## 3. Verification\nThe Sovereign Auditor will probe the Master DB to verify the \`encryptionForced\` flag is globally active.`,
      checklist: `- [ ] [P1] **Registry_Audit**: Verify encryption headers in Master DB.\n- [ ] [P2] **Forced_Enforcement**: Trigger the Active Fix.\n- [ ] [P3] **Final_Check**: Confirm the Prober returns Green.`
    };
  }

  private getMockOSARiskAssessment(): DraftResult {
    return {
      content: `# Online Safety Act: Children's Risk Assessment\n\n## 1. Executive Summary\nThis assessment identifies potential vectors of harm for children accessing the Prompt Suite. The goal is systemic isolation.\n\n## 2. Identified Risks\n- Access to age-restricted AI resource generation.\n- Exposure to unfiltered user-to-user communications.\n\n## 3. Mitigation Strategy\nImplement an atomic Age Verification (AV) gateway behind the PromptResources controller.`,
      checklist: `- [ ] [P1] **Scope_Definition**: Map all user-facing content endpoints.\n- [ ] [P2] **Harm_Triage**: Classify content into Ofcom-regulated categories.\n- [ ] [P3] **Assessment_Sign-off**: Legally certify the assessment with the Senior Manager.`
    };
  }

  private getMockOSAVersion(): DraftResult {
    return {
      content: `# Age Verification Strategy: Technical Selection\n\n## 1. Requirement\nSelect the AV intensity level appropriate to the risk assessment (Soft, Hard, or Systemic).\n\n## 2. Proposed Level: Hard\nThe "Hard" enforcement level requires a verified DOB picker and session-gate for all resource access.\n\n## 3. Rationale\nGiven the AI-generative nature of the platform, Standard (Hard) AV is the clinical requirement to achieve Ofcom compliance.`,
      checklist: `- [ ] [P1] **Intensity_Selection**: Set the AV Dial to "Hard" on the OSA policy card.\n- [ ] [P2] **Protocol_Documentation**: Upload the technical rationale for the "Hard" setting.\n- [ ] [P3] **Accreditation_Lock**: Submit the strategy for AI audit.`
    };
  }

  private getMockOSAGateway(): DraftResult {
    return {
      content: `# Infrastructure Deployment: AV Gateway\n\n## 1. Technical Baseline\nThe AV Gateway is a systemic gate that prevents content rendering until a valid age-verification token is present.\n\n## 2. Implementation\nThe "Active Fix" button injects the \`avEnabled: true\` config into the PromptResources registry.\n\n## 3. Verification\nThe Sovereign Auditor will perform a physical probe of the Resources DB to verify the gateway is active.`,
      checklist: `- [ ] [P1] **Component_Test**: Trigger the AV Gateway Active Fix.\n- [ ] [P2] **Registry_Verification**: Manually verify \`system_config/protection\` in Resources DB.\n- [ ] [P3] **Clinical_Success**: Confirm the OSA Wizard correctly detects the fix.`
    };
  }

  private getMockOSAModeration(): DraftResult {
    return {
      content: `# Content Moderation Framework: Stillwater Registry\n\n## 1. Objective\nEnsure all harmful or illegal content is flagged and removed within regulatory SLAs (≤24h).\n\n## 2. Tooling\nLeverage the internal AI screening and user-flagging endpoints.\n\n## 3. Evidence\nDocument the human-in-the-loop review process and the escalation path for illegal material.`,
      checklist: `- [ ] [P1] **SLA_Definition**: Document the removal timeframe for illegal content.\n- [ ] [P2] **Flagging_Audit**: Verify the "Flag content" button is active in the UI.\n- [ ] [P3] **Final_Accreditation**: Submit the moderation policy for UK regulatory approval.`
    };
  }

  private getMockPrivacyPolicy(dataMap: string): DraftResult {
    return {
      content: `# Stillwater SaaS: Privacy & Transparency Policy\n\n## 1. Introduction\nThis policy establishes the technical and legal framework for data autonomy within the Stillwater SaaS Suite. We are committed to verifiable transparency.\n\n## 2. Data Categories (Sourced from Audit Map)\n${dataMap || 'Technical PII Isolation active.'}\n\n## 3. Security Standards\nAll field-level data is protected using **AES-256-GCM** encryption as verified in Step 2.\n\n## 4. Operational Controls\nWe maintain an active audit trail for all PII access. Sub-processors are restricted through systemic isolation.`,
      checklist: `- [ ] **URL Verification**: Ensure the policy is published at your /privacy endpoint.\n- [ ] **Transparency Sign-off**: Confirm sections 1-4 match your operational context.\n- [ ] **Live Certification**: Submit the URL for final accreditation lock.`
    };
  }

  private getMockDataAudit(): DraftResult {
    return {
      content: `# Sovereign Data Flow Audit: PII Isolation Strategy\n\n## 1. Scope of Audit\nThis technical blueprint identifies the flow of Sensitive Personal Data (PII) within the Stillwater SaaS ecosystem. Our objective is field-level isolation.\n\n## 2. Technical Map\n- **Client Layer**: PromptMasterSPA (Encrypted transit)\n- **Registry Layer**: Stillwater Secure Registry (AES-256-GCM Storage)\n- **Processing Layer**: Isolated AI Controllers\n\n## 3. Compliance Bounds\nThis audit satisfies UK GDPR Article 30 (Record of Processing Activities) by establishing a verifiable baseline of data residency and encryption.`,
      checklist: `- [ ] [P1] **Registry_Anchoring**: Verify that all PII keys are correctly mapped in the Stillwater Secure Registry.\n- [ ] [P2] **Flow_Analysis**: Confirm that data transit between PromptMaster and the Registry utilized TLS 1.3.\n- [ ] [P3] **Isolation_Sign-off**: Legally certify that no PII is leaked to unverified sub-processors.`
    };
  }
}

export const EvidenceServiceInstance = new EvidenceService();
