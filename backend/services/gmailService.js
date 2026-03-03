import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const REDIRECT_URI = 'http://localhost';

function createOAuth2Client() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing credentials:');
    console.error('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
    console.error('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
    throw new Error('Missing Google OAuth credentials in .env file');
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

let oauth2Client = null;

function getOAuth2Client() {
  if (!oauth2Client) {
    oauth2Client = createOAuth2Client();
    
    const tokenPath = join(__dirname, '../config/gmail-token.json');
    if (existsSync(tokenPath)) {
      try {
        const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
        oauth2Client.setCredentials(token);
        console.log('Gmail API credentials loaded successfully');
      } catch (error) {
        console.error('Error loading Gmail token:', error.message);
      }
    }
  }
  return oauth2Client;
}

export function getAuthUrl() {
  const client = getOAuth2Client();
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('\nGenerated Auth URL:');
  console.log(authUrl);
  console.log('\nURL Parameters:');
  const url = new URL(authUrl);
  url.searchParams.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });

  return authUrl;
}

export async function generateTokenFromCode(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function sendEmail(to, subject, htmlBody) {
  try {
    const client = getOAuth2Client();
    
    const tokenPath = join(__dirname, '../config/gmail-token.json');
    if (!existsSync(tokenPath)) {
      throw new Error(
        'Gmail token not found. Run: node scripts/setupGmail.js'
      );
    }
    
    const gmail = google.gmail({ version: 'v1', auth: client });
    
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      htmlBody
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
