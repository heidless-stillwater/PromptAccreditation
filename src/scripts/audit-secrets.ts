const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env.local');
} else {
  console.log('❌ .env.local not found at', envPath);
}

// Now import the rest
import { globalDb } from '../lib/firebase-admin';

async function auditSecrets() {
  console.log('🛡️ Auditing Global Secrets Hub...');
  try {
    const doc = await globalDb.collection('system_config').doc('global_secrets').get();
    if (!doc.exists) {
      console.log('❌ global_secrets document not found.');
      return;
    }

    const data = doc.data() || {};
    const keys = Object.keys(data);
    console.log('✅ Keys found in global_secrets:');
    keys.forEach(k => {
      const isEncrypted = typeof data[k] === 'string' && data[k].includes(':');
      console.log(`  - ${k} [${isEncrypted ? 'ENCRYPTED' : 'PLAIN'}]`);
    });
  } catch (e) {
    console.error('❌ Failed to audit secrets:', e);
  }
  process.exit(0);
}

auditSecrets();
