import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

interface DossierData {
  policy: any;
  auditLogs: any[];
  wizardState: any;
  exportedAt: string;
  exportedBy: string;
}

/**
 * generateDossierPDF - Synthesizes a high-fidelity Clinical Dossier
 */
export async function generateDossierPDF(data: DossierData) {
  const doc = new jsPDF();
  const { policy, auditLogs, wizardState, exportedAt, exportedBy } = data;
  
  // 1. Setup Branding & Colors
  const cobalt = '#1e40af';
  const emerald = '#059669';
  const slate = '#475569';
  const bg_light = '#f8fafc';

  // 2. Helper: Draw Header
  const drawHeader = (pageNum: number) => {
    doc.setFillColor(cobalt);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL DOSSIER', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`SOVEREIGN_REGISTRY_PACK // ${policy.slug.toUpperCase()}`, 20, 30);
    doc.text(`PAGE ${pageNum}`, 180, 20);
  };

  // 3. PAGE 1: EXECUTIVE SUMMARY
  drawHeader(1);
  
  let y = 60;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('Executive Summary', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(slate);
  doc.text(`Accreditation ID: ${policy.id}`, 20, y);
  y += 5;
  doc.text(`Regulatory Alignment: UK GDPR / DPA 2018 / Online Safety Act`, 20, y);
  y += 15;

  // Status Badge
  const statusColor = policy.status === 'green' ? emerald : (policy.status === 'red' ? '#dc2626' : '#d97706');
  doc.setFillColor(statusColor);
  doc.roundedRect(20, y, 60, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(policy.status.toUpperCase() + ' // VERIFIED', 25, y + 10);
  
  y += 25;
  
  // Summary Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Infrastructure Context:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Target Applications: ${policy.targetApps.join(', ')}`, 20, y);
  y += 5;
  doc.text(`Verification Intensity: ${policy.intensity.toUpperCase()}`, 20, y);
  y += 5;
  doc.text(`Last Synchronization: ${format(new Date(policy.updatedAt || exportedAt), 'PPP p')}`, 20, y);
  
  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Policy Purpose:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(policy.description, 170);
  doc.text(splitDesc, 20, y);
  y += splitDesc.length * 5 + 10;

  // 4. PAGE 2: AUDIT TRAIL
  doc.addPage();
  drawHeader(2);
  y = 60;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('Technical Audit Trail', 20, y);
  y += 15;

  // Table Headers
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMESTAMP', 22, y + 5);
  doc.text('ACTION', 60, y + 5);
  doc.text('ACTOR', 110, y + 5);
  doc.text('DETAILS', 150, y + 5);
  y += 13;

  doc.setFont('helvetica', 'normal');
  auditLogs.slice(0, 15).forEach(log => {
     doc.text(format(new Date(log.timestamp), 'MM/dd p'), 22, y);
     doc.text(log.action.toUpperCase(), 60, y);
     doc.text(log.actor.split('@')[0], 110, y);
     
     const detailText = log.details?.status || log.details?.action || '-';
     doc.text(detailText, 150, y);
     
     doc.setDrawColor(230, 230, 230);
     doc.line(20, y + 3, 190, y + 3);
     y += 10;
     
     if (y > 270) {
        doc.addPage();
        drawHeader(doc.getNumberOfPages());
        y = 60;
     }
  });

  // 5. PAGE 3: IMPLEMENTATION EVIDENCE
  doc.addPage();
  drawHeader(3);
  y = 60;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('Implementation Artifacts', 20, y);
  y += 15;

  if (wizardState) {
    const steps: any[] = policy.implementationGuide || [];
    
    // Helper to render text with page-break awareness
    const renderFlowingText = (content: string, fontSize = 10, isBold = false) => {
       doc.setFontSize(fontSize);
       doc.setFont('helvetica', isBold ? 'bold' : 'normal');
       
       const lines = doc.splitTextToSize(content, 170);
       for (const line of lines) {
          if (y > 275) {
             doc.addPage();
             drawHeader(doc.getNumberOfPages());
             y = 60;
             doc.setFontSize(fontSize);
             doc.setFont('helvetica', isBold ? 'bold' : 'normal');
          }
          doc.text(line, 20, y);
          y += fontSize * 0.5;
       }
       y += 5; // Spacing after block
    };

    steps.forEach((step: any) => {
      // Step Title
      if (y > 260) {
         doc.addPage();
         drawHeader(doc.getNumberOfPages());
         y = 60;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cobalt);
      doc.text(step.title.toUpperCase(), 20, y);
      y += 7;
      
      const isComplete = wizardState.stepsCompleted?.includes(step.id);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(isComplete ? emerald : slate);
      doc.text(`VERIFICATION_STATUS: ${isComplete ? 'ANCHORED' : 'PENDING'}`, 20, y);
      y += 8;

      const evidence = wizardState.evidenceUploaded?.[step.id];
      if (evidence) {
         doc.setTextColor(50, 50, 50);
         // Detect if evidence is a URL or full content
         if (evidence.startsWith('http')) {
            doc.setFont('helvetica', 'normal');
            doc.text(`Evidence Reference: ${evidence}`, 20, y);
            y += 10;
         } else {
            // RENDER FULL SYNTHESIZED DOCUMENT
            doc.setDrawColor(240, 240, 240);
            doc.line(20, y - 2, 190, y - 2);
            y += 5;
            renderFlowingText(evidence, 9, false);
            doc.line(20, y, 190, y);
            y += 10;
         }
      }
      
      const checklist = wizardState.checklistsUploaded?.[step.id];
      if (checklist) {
        doc.setTextColor(slate);
        doc.setFont('helvetica', 'bold');
        doc.text('Verification Checklist Summary:', 20, y);
        y += 5;
        renderFlowingText(checklist, 8, false);
      }
      
      y += 5;
    });
  }

  // 6. CRYPTOGRAPHIC FOOTER
  const fingerprint = await computeFingerprint(data);
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 280, 210, 17, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('courier', 'normal');
    doc.text(`CLINICAL_SIGNATURE_MANIFEST: ${fingerprint}`, 10, 287);
    doc.text(`EXPORTED_BY: ${exportedBy} // ${exportedAt}`, 10, 292);
  }

  // 7. Save Document
  doc.save(`${policy.slug}_dossier_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * computeFingerprint - Generates a SHA-256 hash of the audit data
 */
async function computeFingerprint(data: DossierData) {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}
