import { jsPDF } from 'jspdf';
import { TicketService } from './ticket-service';
import { PolicyService } from './policy-service';
import { AuditService } from './audit-service';
import { format } from 'date-fns';

export const ReportService = {
  /**
   * Synthesize a comprehensive compliance report for the entire suite.
   */
  async generateQuarterlyReport(): Promise<Buffer> {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = format(now, 'PPP');

    // 1. Fetching Report Data
    const [policies, openTickets, resolvedTickets, recentAudit] = await Promise.all([
      PolicyService.getAllPolicies(),
      TicketService.getOpenTickets(),
      TicketService.getResolvedTickets(),
      AuditService.getRecentLogs(50)
    ]);

    const aggregateScore = policies.reduce((acc, p) => acc + (p.status === 'green' ? 1 : 0), 0) / policies.length * 100;

    // 2. Cover Page
    doc.setFillColor(15, 23, 42); // Navy Dark
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text('Compliance Accreditation', 20, 60);
    doc.setFontSize(18);
    doc.text('Quarterly Governance Report', 20, 75);
    
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(20, 85, 100, 85);

    doc.setFontSize(10);
    doc.text(`Generated: ${dateStr}`, 20, 260);
    doc.text('Prepared by: Stillwater AI Accreditation Engine', 20, 267);

    // 3. Executive Summary
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('1. Executive Summary', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Aggregate Compliance Score: ${Math.round(aggregateScore)}%`, 20, 45);
    doc.text(`Active Policies Monitored: ${policies.length}`, 20, 52);
    doc.text(`Open Remediation Actions: ${openTickets.length}`, 20, 59);
    doc.text(`Resolved Incidents (QTD): ${resolvedTickets.length}`, 20, 66);

    // 4. Policy Status Breakdown
    doc.setFontSize(14);
    doc.text('2. Policy Framework Status', 20, 85);
    
    let y = 100;
    policies.forEach((p, i) => {
      doc.setFontSize(11);
      doc.text(`${i + 1}. ${p.name}`, 25, y);
      const statusColor = p.status === 'green' ? [16, 185, 129] : p.status === 'amber' ? [245, 158, 11] : [239, 68, 68];
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(p.status.toUpperCase(), 160, y);
      doc.setTextColor(0, 0, 0);
      y += 8;
    });

    // 5. Remediation Ledger (Drift Events)
    doc.addPage();
    doc.setFontSize(16);
    doc.text('3. Remediation & Drift Ledger', 20, 30);
    doc.setFontSize(10);
    doc.text('Summary of automated drift detections and manual ticket resolutions.', 20, 40);

    y = 55;
    const allTickets = [...openTickets, ...resolvedTickets].slice(0, 15);
    allTickets.forEach((t) => {
      doc.setFontSize(9);
      const date = t.createdAt instanceof Date ? format(t.createdAt, 'yyyy-MM-dd') : 'Recently';
      doc.text(`[${date}] ${t.title.substring(0, 60)}...`, 20, y);
      doc.text(t.status.toUpperCase(), 170, y);
      y += 6;
    });

    // 6. Immutable Audit Log (Snapshot)
    doc.addPage();
    doc.setFontSize(16);
    doc.text('4. Immutable Audit Snapshot', 20, 30);
    doc.setFontSize(10);
    doc.text('Direct trace from the cryptographically-verifiable system ledger.', 20, 40);

    y = 55;
    recentAudit.slice(0, 25).forEach((log) => {
      doc.setFontSize(8);
      const date = log.timestamp instanceof Date ? format(log.timestamp, 'HH:mm:ss') : 'Recently';
      doc.text(`${date} - ACTION: ${log.action} | ACTOR: ${log.actor}`, 20, y);
      y += 5;
    });

    // Return as buffer
    return Buffer.from(doc.output('arraybuffer'));
  }
};
