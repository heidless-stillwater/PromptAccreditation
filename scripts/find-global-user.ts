import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (privateKey) {
  privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function findUser() {
  console.log('🔍 SEARCHING GLOBAL IDENTITY DB...');
  try {
    const collections = await db.listCollections();
    console.log('📦 COLLECTIONS:', collections.map(c => c.id));
    
    for (const coll of collections) {
      if (coll.id === 'users') {
        const snap = await coll.limit(5).get();
        console.log('📄 USERS FOUND:', snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }
  } catch (err: any) {
    console.error('❌ Database error:', err.message);
  }
}

findUser();
