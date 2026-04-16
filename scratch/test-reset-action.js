const { resetWizardAction } = require('../src/lib/actions');
const { AuthService } = require('../src/lib/services/auth-service');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock revalidatePath
const nextCache = require('next/cache');
nextCache.revalidatePath = (path) => console.log(`[Mock] Revalidating ${path}`);

// Mock AuthService to return local-user
AuthService.getCurrentUser = async () => ({
  uid: 'local-user',
  email: 'dev@stillwater.io',
  displayName: 'Sovereign Developer',
  isAdmin: true,
  tier: 'enterprise'
});

async function testReset() {
  console.log('--- EMERGENCY_RESET_DIAGNOSTIC ---');
  try {
    const policyId = 'data-protection-act';
    console.log(`[Test] Triggering reset for ${policyId}...`);
    const result = await resetWizardAction(policyId);
    console.log('[Test] Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('[Test] SUCCESS: Action executed without crash.');
    } else {
      console.log('[Test] FAILED: Action returned failure result.');
    }
  } catch (err) {
    console.error('[Test] CRASH:', err.message);
    console.error(err.stack);
  }
}

testReset();
