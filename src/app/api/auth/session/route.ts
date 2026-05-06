export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID Token required' }, { status: 400 });
    }
    
    const profile = await createSession(idToken).catch(err => {
      console.error('[Session_Route] creation error:', err);
      return { error: err.message || 'Unknown creation error' };
    });
    
    if (profile && !('error' in profile)) {
      return NextResponse.json({ success: true, profile });
    } else {
      const errorMsg = profile && 'error' in profile ? profile.error : 'Session creation failed';
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server crash' }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
