import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Ensure .env.local is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Toggle Compliance Status
 * Usage: npx tsx scripts/toggle-compliance.ts [red|green|amber]
 */
async function toggle() {
    const mode = process.argv[2] || '';
    
    if (!mode) {
        console.error('Usage: npx tsx scripts/toggle-compliance.ts [osa-red|dpa-red|sec-red|all-green]');
        process.exit(1);
    }

    if (getApps().length === 0) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }

    const db = getFirestore(getApps()[0], 'promptaccreditation-db-0');
    
    const applyDrift = async (slug: string, status: 'red' | 'green' | 'amber', probeId?: string) => {
        console.log(`[Sentinel] Toggling ${slug} -> ${status.toUpperCase()}${probeId ? ` (Probe: ${probeId})` : ''}`);
        
        const q = await db.collection('policies').where('slug', '==', slug).limit(1).get();
        if (q.empty) {
            console.error(`❌ Policy not found: ${slug}`);
            return;
        }
        
        const doc = q.docs[0];
        const policy = doc.data();
        
        const updatedChecks = (policy.checks || []).map((c: any) => {
            if (probeId && (c.id === probeId || c.probeId === probeId)) {
                return { ...c, status, lastChecked: new Date() };
            }
            return c;
        });

        await doc.ref.update({ 
            status, 
            checks: updatedChecks,
            updatedAt: new Date() 
        });
        console.log(`✅ ${slug} updated.`);
    };

    switch (mode) {
        case 'osa-red':
            await applyDrift('online-safety-act', 'red', 'probe-av-gateway');
            break;
        case 'osa-amber':
            await applyDrift('online-safety-act', 'amber', 'probe-av-gateway');
            break;
        case 'dpa-red':
            await applyDrift('data-protection-act', 'red', 'probe-encryption-enforcement');
            break;
        case 'sec-red':
            await applyDrift('site-security', 'red', 'probe-security-headers');
            break;
        case 'all-drift':
            await applyDrift('online-safety-act', 'red', 'probe-av-gateway');
            await applyDrift('data-protection-act', 'red', 'probe-encryption-enforcement');
            await applyDrift('site-security', 'amber', 'probe-security-headers');
            break;
        case 'all-green':
            await applyDrift('online-safety-act', 'green', 'probe-av-gateway');
            await applyDrift('data-protection-act', 'green', 'probe-encryption-enforcement');
            await applyDrift('site-security', 'green', 'probe-security-headers');
            break;
        case 'red': // legacy support
            await applyDrift('online-safety-act', 'red', 'probe-av-gateway');
            break;
        case 'green': // legacy support
            await applyDrift('online-safety-act', 'green', 'probe-av-gateway');
            break;
        default:
            console.error('Invalid mode. Use: osa-red, dpa-red, sec-red, all-drift, all-green');
            process.exit(1);
    }

    console.log(`✅ Drift Simulation Complete.`);
    process.exit(0);
}

toggle().catch(err => {
    console.error('❌ Failed to toggle compliance:', err.message);
    process.exit(1);
});
