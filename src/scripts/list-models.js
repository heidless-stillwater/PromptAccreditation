const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

async function run() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const admin = require('firebase-admin');
  const { getFirestore } = require('firebase-admin/firestore');
  
  const app = admin.initializeApp({
    credential: admin.credential.cert({ 
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, 
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, 
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') 
    })
  }, 'LIST_MODELS');

  const db = getFirestore(app, 'prompttool-db-0');
  const doc = await db.collection('system_config').doc('global_secrets').get();
  const encrypted = doc.data()?.STILLWATER_AI_TOKEN;

  if (!encrypted) {
      console.log('❌ STILLWATER_AI_TOKEN not found in Firestore.');
      process.exit(1);
  }

  // Simple decryption for the script
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
  const crypto = require('crypto');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(process.env.CONFIG_ENCRYPTION_KEY, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const apiKey = decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');

  const genai = new GoogleGenAI({ apiKey });
  
  try {
    const models = await genai.listModels();
    console.log('✅ Available Models:');
    models.map(m => console.log(` - ${m.name} [${m.supportedGenerationMethods.join(', ')}]`));
  } catch (e) {
    console.error('❌ Failed to list models:', e.message);
  }
}

run();
