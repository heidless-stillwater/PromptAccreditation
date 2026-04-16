import { NextRequest, NextResponse } from 'next/server';
import { createSession, destroySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID Token required' }, { status: 400 });
    }
    
    const profile = await createSession(idToken);
    
    if (profile) {
      return NextResponse.json({ success: true, profile });
    } else {
      return NextResponse.json({ error: 'Session creation failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
