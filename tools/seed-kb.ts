import { KBService } from '../src/lib/services/kb-service';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables for Firebase Admin
dotenv.config({ path: '.env.local' });

async function seed() {
    console.log('🚀 Initializing Sovereign Grounding Ingestion...');
    
    const filePath = path.join(process.cwd(), 'docs/grounding/uk-online-safety-act-2023.md');
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ Error: Regulatory manifest not found at', filePath);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const title = 'UK Online Safety Act 2023 (Core Baseline)';
    const category = 'safety';
    const uploadedBy = 'Sentinel-Grounding-Service';

    try {
        console.log(`🧠 Ingesting: "${title}"...`);
        const docId = await KBService.chunkAndEmbed(title, content, category, uploadedBy);
        console.log(`✅ Grounding Complete. Document ID: ${docId}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Ingestion Failed:', err);
        process.exit(1);
    }
}

seed();
