
const admin = require('firebase-admin');
const { cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[key] = val;
    }
});

const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey) {
    console.error('Missing private key');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
}

const dbId = env.FIREBASE_DATABASE_ID || 'promptaccreditation-db-0';
console.log(`Connecting to database: ${dbId}...`);

const db = getFirestore(admin.app(), dbId);

async function test() {
    try {
        console.log('Fetching tickets...');
        const snap = await db.collection('tickets').limit(1).get();
        console.log('Success! Found', snap.size, 'tickets.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

// Timeout after 10 seconds
setTimeout(() => {
    console.error('TIMED OUT after 10s');
    process.exit(1);
}, 10000);

test();
