const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
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

  const app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  }, 'KB_SCANNER');

  const db = getFirestore(app, 'promptaccreditation-db-0');
  
  try {
    const collections = await db.listCollections();
    console.log('✅ Collections in promptaccreditation-db-0:', collections.map(c => c.id).join(', '));
    
    const collectionsToScan = ['kb_documents', 'policies'];
    
    for (const collName of collectionsToScan) {
      const documents = await db.collection(collName).get();
      console.log(`🔍 Checking ${documents.docs.length} documents in [${collName}] for "AIza"...`);

      documents.docs.forEach(doc => {
        const data = doc.data();
        const content = JSON.stringify(data);
        if (content.includes('AIza')) {
            console.log(`⚠️  LEAK FOUND in ${collName} [${doc.id}]: ${data.title || data.name || 'Untitled'}`);
            found = true;
        }
      });
    }

    if (!found) {
        console.log('✅ No strings matching "AIza" found in Knowledge Base.');
    }
  } catch (e) {
    console.error('❌ Firestore Error:', e);
  }
  process.exit(0);
}

run();
