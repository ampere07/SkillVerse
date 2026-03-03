import { google } from 'googleapis';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const REDIRECT_URI = 'http://localhost';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('\n=== Gmail API Setup ===\n');
console.log('1. Visit this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize the application');
console.log('3. Copy the code from the URL (after "code=" and before "&scope")\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    const configDir = join(__dirname, '../config');
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    const tokenPath = join(configDir, 'gmail-token.json');
    writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    
    console.log('\n✓ Token saved successfully to:', tokenPath);
    console.log('\nYou can now send emails using the Gmail service.');
  } catch (error) {
    console.error('\n✗ Error obtaining token:', error.message);
  }
  
  rl.close();
});
