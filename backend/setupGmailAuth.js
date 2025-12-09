import { getAuthUrl, generateTokenFromCode } from './services/gmailService.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupGmailAuth() {
  console.log('\n========================================');
  console.log('Gmail API OAuth2 Setup');
  console.log('========================================\n');

  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file');
    }

    console.log('Using credentials from .env file');
    console.log(`Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
    
    const authUrl = getAuthUrl();
    
    console.log('\n1. Visit this URL to authorize the application:\n');
    console.log(authUrl);
    console.log('\n2. After authorization, you will be redirected to a page with an authorization code.');
    console.log('3. Copy the authorization code from the page.\n');

    const code = await question('Enter the authorization code: ');

    console.log('\nGenerating access token...');
    const token = await generateTokenFromCode(code);

    const tokenPath = join(__dirname, 'config/gmail-token.json');
    writeFileSync(tokenPath, JSON.stringify(token, null, 2));

    console.log('\n✓ Success! Gmail API is now configured.');
    console.log('Token saved to:', tokenPath);
    console.log('\nYou can now start the server and send verification emails.\n');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nPlease make sure:');
    console.error('1. The .env file has GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    console.error('2. You copied the authorization code correctly');
    console.error('3. The Google Cloud project has Gmail API enabled');
    console.error('4. Run "npm install" to ensure googleapis package is installed\n');
  } finally {
    rl.close();
  }
}

setupGmailAuth();
