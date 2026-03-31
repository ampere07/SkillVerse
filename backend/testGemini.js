import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  console.log('\n--- Gemini API Test ---');

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-3-flash-preview';

  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY not found in .env');
    return;
  }

  console.log(`Using Model: ${modelName}`);
  console.log(`Using API Key starting with: ${apiKey.substring(0, 7)}...`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log('\nGenerating response...');
    const startTime = Date.now();

    const result = await model.generateContent("Hello! Say 'Gemini is working correctly' if you can read this.");
    const response = result.response.text();

    const duration = (Date.now() - startTime) / 1000;

    console.log(`\n✅ SUCCESS in ${duration}s!`);
    console.log('--- Response ---');
    console.log(response);
    console.log('------------------');

  } catch (error) {
    console.error('\n❌ FAILED!');
    console.error('Error Type:', error.name || 'Unknown');
    console.error('Message:', error.message);

    if (error.message.includes('400')) {
      console.log('\n💡 Tip: Your API Key is invalid. Check for extra spaces or errors.');
    } else if (error.message.includes('404')) {
      console.log(`\n💡 Tip: Model "${modelName}" was not found. Try gemini-1.5-flash.`);
    } else if (error.message.includes('429')) {
      console.log('\n💡 Tip: You hit the free tier rate limit. Wait 60 seconds.');
    }
  }
}

testGemini();
