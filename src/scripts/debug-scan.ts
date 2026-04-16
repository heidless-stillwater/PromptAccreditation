import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { MonitoringService } from '../lib/services/monitoring-service';

async function debug() {
  console.log('🔍 Running diagnostic Suite Scan...\n');
  try {
    const result = await MonitoringService.scanForDrifts();
    console.log('\n✅ Scan completed successfully:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('\n❌ Scan FAILED with error:');
    console.error(err);
  }
  process.exit(0);
}

debug();
