export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth-service';
import { PolicyService } from '@/lib/services/policy-service';

export async function POST(req: Request) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { policyId } = await req.json();
    if (!policyId) {
      return NextResponse.json({ success: false, message: 'Policy ID is required' }, { status: 400 });
    }

    console.log(`[API] FORCE_SYNC_TRIGGERED: ${policyId} for ${user.uid}`);
    const result = await PolicyService.forceAccreditationSync(policyId, user.uid);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[API] Force Sync Failed:`, error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
