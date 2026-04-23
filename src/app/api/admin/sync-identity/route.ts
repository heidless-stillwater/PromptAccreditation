import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.tier !== 'enterprise') {
        return NextResponse.json({ error: 'Unauthorized: Sovereign Admin Authority required.' }, { status: 403 });
    }

    const apps = getApps();
    if (apps.length === 0) throw new Error('Firebase not initialized');

    const app = apps[0];
    const sourceDb = getFirestore(app, 'prompttool-db-0');
    const targetDb = getFirestore(app, 'promptaccreditation-db-0');

    console.log('[IdentitySync] Starting Suite-Wide Synchronization...');

    // 1. Fetch Users from Master (Tool)
    const usersSnap = await sourceDb.collection('users').get();
    
    if (usersSnap.empty) {
      return NextResponse.json({ status: 'EMPTY', message: 'No users found in Master Registry.' });
    }

    const batch = targetDb.batch();
    let count = 0;

    usersSnap.forEach(doc => {
      const data = doc.data();
      batch.set(targetDb.collection('users').doc(doc.id), data, { merge: true });
      count++;
    });

    await batch.commit();

    return NextResponse.json({
      status: 'SUCCESS',
      syncCount: count,
      source: 'prompttool-db-0',
      target: 'promptaccreditation-db-0',
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
