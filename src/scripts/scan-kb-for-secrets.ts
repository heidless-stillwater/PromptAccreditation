import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { accreditationDb } from '../lib/firebase-admin';

async function scanKB() {
  console.log('🔍 Scanning Knowledge Base for leaked strings...');
  try {
    const documents = await accreditationDb.collection('knowledge_base').get();
    console.log(`Checking ${documents.docs.length} documents...`);

    let found = false;
    documents.docs.forEach(doc => {
      const data = doc.data();
      const content = JSON.stringify(data);
      if (content.includes('AIza')) {
          console.log(`⚠️  LEAK FOUND in KB Document [${doc.id}]: ${data.title || 'Untitled'}`);
          found = true;
      }
    });

    if (!found) {
        console.log('✅ No strings matching "AIza" found in Knowledge Base.');
    }

  } catch (e) {
    console.error('❌ Failed to scan KB:', e);
  }
  process.exit(0);
}

scanKB();
