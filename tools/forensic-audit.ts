import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

async function audit() {
    const db = getFirestore(undefined, 'prompttool-db-0');
    const uid = 'nNdenyyfKaN9yNB9Ly3vhhaHLXx1'; // Rob
    const doc = await db.collection('users').doc(uid).get();
    
    if (doc.exists) {
        const data = doc.data()!;
        console.log('--- FORENSIC IDENTITY AUDIT ---');
        
        const scan = (obj: any, path: string = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            const keys = Object.keys(obj);
            if (keys.includes('activeSuites') || keys.includes('bundleId') || keys.includes('expiresAt')) {
                console.log(`FOUND TARGET OBJECT AT PATH: [${path || 'ROOT'}]`);
                console.log(`KEYS:`, keys);
                console.log(`VALUE:`, JSON.stringify(obj, null, 2));
            }
            
            keys.forEach(k => {
                if (typeof obj[k] === 'object') {
                    scan(obj[k], path ? `${path}.${k}` : k);
                }
            });
        };
        
        scan(data);
    } else {
        console.log('User not found');
    }
}

audit().catch(console.error);
