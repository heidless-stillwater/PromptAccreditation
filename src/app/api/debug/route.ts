export const dynamic = "force-static";
import { NextResponse } from 'next/server';

/**
 * SOVEREIGN PRODUCTION DIAGNOSTIC
 * Verifies if the Node runtime is alive without triggering Registry logic.
 */
export async function GET() {
  return NextResponse.json({
    status: 'sovereign_alive',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'missing',
      hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      keyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
      hasDatabaseId: !!process.env.FIREBASE_DATABASE_ID,
      nodeVersion: process.version,
      firebaseConfig: !!process.env.FIREBASE_CONFIG
    }
  });
}
