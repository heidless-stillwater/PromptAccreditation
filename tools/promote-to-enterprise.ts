import 'dotenv/config';
import { globalDb, adminAuth } from '../lib/firebase-admin';

/**
 * PRODUCTION PROMOTION SCRIPT
 * Promotes all registered users to the Enterprise tier for development.
 */
async function promoteAll() {
  console.log('🚀 Starting Suite-Wide User Promotion...');
  
  try {
    const usersSnap = await globalDb.collection('users').get();
    
    if (usersSnap.empty) {
      console.log('⚠️ No users found in Global Hub. Creating admin placeholder...');
      // If you just logged in, your user should be here. 
      // If not, we'll wait for you to login once.
      return;
    }

    const batch = globalDb.batch();
    
    usersSnap.docs.forEach(doc => {
      console.log(`✨ Promoting user: ${doc.id} (${doc.data().email}) -> ENTERPRISE`);
      batch.update(doc.ref, { 
        tier: 'enterprise',
        isAdmin: true,
        updatedAt: new Date()
      });
    });

    await batch.commit();
    console.log('✅ All users promoted. Authority level: ENTERPRISE.');

  } catch (error) {
    console.error('❌ Promotion failed:', error);
  } finally {
    process.exit(0);
  }
}

promoteAll();
