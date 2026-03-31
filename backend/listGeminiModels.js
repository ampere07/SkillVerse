import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  console.log('\n--- Gemini API Model Availability Test ---');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY not found in .env');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempting to use the new v1 endpoint by listing
    console.log('Fetching available models from Google AI...');
    
    // The SDK doesnt expose a direct listModels method, but we can catch the error 
    // to see if we can find a better model. 
    // Actually, let's try the modern 2.0 version since 1.5 is failing for you.

    const testModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-3.0-flash'];
    
    for (const name of testModels) {
      console.log(`\nTesting: ${name}...`);
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent("Say 'OK'");
        console.log(`✅ Model "${name}" is WORKING!`);
        console.log('Response:', result.response.text());
        return; // found one!
      } catch (err) {
        console.log(`❌ Model "${name}" failed: ${err.message.substring(0, 50)}...`);
      }
    }

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

listModels();
