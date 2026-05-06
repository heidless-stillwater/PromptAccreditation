export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server';
import { getDb, withTimeout } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const db = await getDb('promptaccreditation-db-0');
  
  if (!db) {
    return NextResponse.json({ status: 'ERROR', message: 'DB initialization failed' });
  }

  try {
    const snap = await withTimeout(db.collection('tickets').limit(1).get(), 5000) as any;
    return NextResponse.json({ 
        status: 'OK', 
        ticketsFound: snap.size
    });
  } catch (err: any) {
    return NextResponse.json({ 
        status: 'TIMEOUT/ERROR', 
        message: err.message
    });
  }
}
