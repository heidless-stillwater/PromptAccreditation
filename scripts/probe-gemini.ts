const path = require('path');
const { getGemini, MODELS } = require(path.resolve(__dirname, '../src/lib/gemini'));
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function probe() {
  try {
    const genai = await getGemini();
    console.log('Gemini Instance Keys:', Object.keys(genai));
    
    // Attempt a tiny generation
    const result = await genai.models.generateContent({
      model: MODELS.FLASH,
      contents: [{ role: 'user', parts: [{ text: 'Say hi.' }] }]
    });
    
    console.log('Result Full Structure:', JSON.stringify(result, null, 2).substring(0, 5000));
    
    if (result.candidates && result.candidates[0].content) {
       console.log('SUCCESS: Content found in result.candidates[0].content.parts[0].text');
    } else {
       console.log('PROBABLE SUCCESS: Result might be the content itself? Keys:', Object.keys(result));
    }
  } catch (err) {
    console.error('PROBE FAILED:', err);
  }
}

probe();
