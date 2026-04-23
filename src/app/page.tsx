import { PolicyService } from '@/lib/services/policy-service';
import CommandCentreClient from './CommandCentreClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CommandCentre() {
  // Fetch live compliance data from the Sovereign Registry
  const policies = await PolicyService.getAllPolicies();
  const score = await PolicyService.getComplianceScore();

  return (
    <CommandCentreClient 
      initialPolicies={policies} 
      initialScore={score} 
    />
  );
}
