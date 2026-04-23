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

async function syncSuiteIdentities() {
    console.log('--- Initiating Global Identity Alignment ---');
    console.log('Master Node: prompttool-db-0');
    console.log('Target Node: promptmaster-spa-db-0');

    const masterDb = getFirestore(getApps()[0], 'prompttool-db-0');
    const targetDb = getFirestore(getApps()[0], 'promptmaster-spa-db-0');

    try {
        const masterUsers = await masterDb.collection('users').get();
        console.log(`[DATA] Found ${masterUsers.size} master identity records.`);

        let repairCount = 0;
        let skipCount = 0;

        for (const masterDoc of masterUsers.docs) {
            const masterData = masterDoc.data();
            const targetRef = targetDb.collection('users').doc(masterDoc.id);
            const targetDoc = await targetRef.get();
            if (targetDoc.exists) {
                const targetData = targetDoc.data();
                if (!targetData) continue;
                
                // Detection Logic
                const needsSync = 
                    masterData.displayName !== targetData.displayName ||
                    masterData.role !== targetData.role ||
                    masterData.photoURL !== targetData.photoURL;

                if (needsSync) {
                    console.log(`[REPAIR] Syncing user ${masterDoc.id} (${masterData.displayName || 'Unnamed'})`);
                    await targetRef.update({
                        displayName: masterData.displayName || targetData.displayName,
                        role: masterData.role || targetData.role || 'member',
                        photoURL: masterData.photoURL || targetData.photoURL || null,
                        email: masterData.email || targetData.email,
                        isSynced: true,
                        updatedAt: new Date()
                    });
                    repairCount++;
                } else {
                    skipCount++;
                }
            } else {
                // User doesn't exist in local yet, no conflict
                skipCount++;
            }
        }

        console.log(`[SUCCESS] Identity alignment complete.`);
        console.log(`- Repaired: ${repairCount}`);
        console.log(`- Valid: ${skipCount}`);
    } catch (err) {
        console.error('[ERROR] Alignment failed:', err);
        process.exit(1);
    }

    console.log('--- Operation Complete ---');
}

syncSuiteIdentities().catch(console.error);
