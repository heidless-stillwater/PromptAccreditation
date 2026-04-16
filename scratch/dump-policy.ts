import { PolicyService } from '../src/lib/services/policy-service';

async function dump() {
  const p = await PolicyService.getPolicyBySlug('data-protection-act');
  console.log('POLICY_DUMP:', JSON.stringify(p, null, 2));
}

dump().catch(console.error);
