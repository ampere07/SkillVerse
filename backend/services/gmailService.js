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

    // 1. Try to load from Environment Variable first (best for Production/Render)
    if (process.env.GMAIL_REFRESH_TOKEN) {
      try {
        oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
        console.log('Gmail API credentials loaded successfully from GMAIL_REFRESH_TOKEN');
        return oauth2Client;
      } catch (error) {
        console.error('Error loading Gmail refresh token from environment:', error.message);
      }
    }

    // 2. Try to load from complete Token JSON string in Environment
    if (process.env.GMAIL_TOKEN) {
      try {
        const token = JSON.parse(process.env.GMAIL_TOKEN);
        oauth2Client.setCredentials(token);
        console.log('Gmail API credentials loaded successfully from GMAIL_TOKEN');
        return oauth2Client;
      } catch (error) {
        console.error('Error loading Gmail token from environment:', error.message);
      }
    }

    // 3. Fallback to Local File (for Local Development)
    const tokenPath = join(__dirname, '../config/gmail-token.json');
    if (existsSync(tokenPath)) {
      try {
        const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
        oauth2Client.setCredentials(token);
        console.log('Gmail API credentials loaded successfully from local file');
      } catch (error) {
        console.error('Error loading Gmail token from file:', error.message);
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
    if (!process.env.GMAIL_REFRESH_TOKEN && !process.env.GMAIL_TOKEN && !existsSync(tokenPath)) {
      throw new Error(
        'Gmail credentials not found. Set GMAIL_REFRESH_TOKEN environment variable in production, or run setupGmailAuth.js locally.'
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
