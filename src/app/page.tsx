import { PolicyService } from '@/lib/services/policy-service';
import CommandCentreClient from './CommandCentreClient';


export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CommandCentre() {
  const { withTimeout } = await import('@/lib/firebase-admin');

  // Fetch live compliance data with a hard safety timeout
  const [policies, score] = await withTimeout(Promise.all([
    PolicyService.getAllPolicies(),
    PolicyService.getComplianceScore()
  ]), 8000).catch(err => {
    console.warn('[Home] Database timeout. Loading baseline data.');
    return [[], 0]; // Fallback to empty state
  });

  return (
    <CommandCentreClient 
      initialPolicies={policies as any[]} 
      initialScore={score as number} 
    />
  );


}
