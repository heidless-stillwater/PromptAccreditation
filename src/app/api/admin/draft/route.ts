export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server';
import { DocDraftingService } from '@/lib/services/doc-drafting-service';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, policyId, stepId, responses, appId = 'PromptResources' } = body;

    if (type === 'risk_assessment') {
      const { docId } = await DocDraftingService.generateRiskAssessment(
        user.uid,
        appId,
        responses
      );

      return NextResponse.json({ success: true, docId });
    }

    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
  } catch (err) {
    console.error('[DraftAPI] Error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
