import { google } from 'googleapis';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REDIRECT_URI = 'http://localhost';
const CODE = '4/0ASc3gC2gF2ZaKMC8I9yWYZ0glFAO9JOf1K8MPdI_MwcKpUpIkzgCPe53F7tG5OENXE3Jeg';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

try {
  const { tokens } = await oauth2Client.getToken(CODE);
  
  const configDir = join(__dirname, '../config');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  const tokenPath = join(configDir, 'gmail-token.json');
  writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  
  console.log('✓ Token saved successfully to:', tokenPath);
  console.log('\nToken contents:');
  console.log(JSON.stringify(tokens, null, 2));
} catch (error) {
  console.error('✗ Error obtaining token:', error.message);
}
