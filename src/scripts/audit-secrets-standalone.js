const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

async function run() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ Loaded .env.local');
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.log('❌ Missing credentials in .env.local');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });

  const db = admin.firestore();
  
  try {
    const doc = await db.collection('system_config').doc('global_secrets').get();
    if (!doc.exists) {
        console.log('❌ global_secrets document not found.');
      } else {
        const data = doc.data() || {};
        console.log('✅ Keys in global_secrets:');
        Object.keys(data).forEach(k => {
          const isEncrypted = typeof data[k] === 'string' && data[k].includes(':');
          console.log(`  - ${k} [${isEncrypted ? 'ENCRYPTED' : 'PLAIN'}]`);
        });
      }
  } catch (e) {
    console.error('❌ Firestore Error:', e);
  }
}

run();
