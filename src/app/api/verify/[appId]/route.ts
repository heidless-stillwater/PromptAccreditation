import { NextRequest, NextResponse } from 'next/server';
import { PolicyService } from '@/lib/services/policy-service';

/**
 * Public API to verify an app's compliance status.
 * GET /api/verify/[appId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params;
    
    // 1. Basic Validation
    if (!appId) {
      return NextResponse.json({ success: false, error: 'App ID required' }, { status: 400 });
    }

    // 2. Fetch Compliance Status
    const status = await PolicyService.getAppComplianceStatus(appId);

    // 3. Return official Seal of Approval payload
    return NextResponse.json({
      success: true,
      appId,
      verified: status.passed,
      complianceScore: status.score,
      lastAudit: status.lastScan,
      failingPolicies: status.failingPolicies,
      sealUrl: status.passed 
        ? `https://stillwater-accreditation.web.app/seals/verified.svg`
        : null,
      message: status.passed 
        ? 'This application is compliant with all mandatory suite-wide policies.' 
        : 'This application has detected compliance gaps that require remediation.'
    }, {
      // Allow cross-origin requests so sister apps can call this
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
