import { NextResponse } from 'next/server';
import { ReportService } from '@/lib/services/report-service';

/**
 * API to generate and download the Quarterly Compliance Report.
 * GET /api/admin/report
 */
export async function GET() {
  try {
    const pdfBuffer = await ReportService.generateQuarterlyReport();
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PromptSuite_Compliance_Report_${dateStr}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
