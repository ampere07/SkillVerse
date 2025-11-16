import 'dotenv/config';
import { HfInference } from '@huggingface/inference';

const API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_NAME = 'Qwen/Qwen2.5-Coder-7B-Instruct';

console.log('Testing Hugging Face API connection...\n');

if (!API_KEY) {
  console.error('❌ HUGGINGFACE_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key found');
console.log('🔄 Sending test request to Hugging Face using Chat Completion API...\n');

const hf = new HfInference(API_KEY);

try {
  const response = await hf.chatCompletion({
    model: MODEL_NAME,
    messages: [
      {
        role: "user",
        content: "What is Java programming language? Provide a brief answer in 2-3 sentences."
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });

  console.log('✅ Success! API is working correctly\n');
  console.log('Generated Response:', response.choices[0].message.content);
  console.log('\n✅ Your AI analysis will work on localhost!');
  
} catch (error) {
  console.error('❌ Error testing API:\n');
  console.error('Error:', error.message);
  
  if (error.message.includes('not supported')) {
    console.error('\n⚠️  The model/provider combination does not support chat completion.');
    console.error('💡 Trying alternative model: meta-llama/Llama-3.2-3B-Instruct\n');
    
    try {
      const altResponse = await hf.chatCompletion({
        model: 'meta-llama/Llama-3.2-3B-Instruct',
        messages: [
          {
            role: "user",
            content: "What is Java programming language? Provide a brief answer in 2-3 sentences."
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });
      
      console.log('✅ Alternative model works!\n');
      console.log('Generated Response:', altResponse.choices[0].message.content);
      console.log('\n💡 Consider using meta-llama/Llama-3.2-3B-Instruct in huggingfaceService.js');
      
    } catch (altError) {
      console.error('❌ Alternative model also failed:', altError.message);
      console.error('\n💡 You may need to configure your inference providers at:');
      console.error('   https://hf.co/settings/inference-providers');
    }
  } else if (error.message.includes('401')) {
    console.error('\n⚠️  Your API key is invalid. Generate a new one at:');
    console.error('   https://huggingface.co/settings/tokens');
  } else if (error.message.includes('timeout')) {
    console.error('\n⚠️  Request timed out. Model might be loading. Try again in 30 seconds.');
  }
}
