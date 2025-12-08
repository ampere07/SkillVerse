import { getAuthUrl, generateTokenFromCode } from './services/gmailService.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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
    const authUrl = getAuthUrl();
    
    console.log('1. Visit this URL to authorize the application:\n');
    console.log(authUrl);
    console.log('\n2. After authorization, you will be redirected to a URL.');
    console.log('3. Copy the authorization code from the URL (after "code=").\n');

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
    console.error('1. The gmail-credentials.json file exists in backend/config/');
    console.error('2. You copied the authorization code correctly');
    console.error('3. The Google Cloud project has Gmail API enabled\n');
  } finally {
    rl.close();
  }
}

setupGmailAuth();
