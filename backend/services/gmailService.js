import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = join(__dirname, '../config/gmail-token.json');
const CREDENTIALS_PATH = join(__dirname, '../config/gmail-credentials.json');

let oAuth2Client = null;

const loadCredentials = () => {
  try {
    const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));
    return credentials.installed || credentials.web;
  } catch (error) {
    console.error('Error loading Gmail credentials:', error);
    throw new Error('Gmail credentials file not found. Please add gmail-credentials.json to backend/config/');
  }
};

const loadToken = () => {
  try {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    return token;
  } catch (error) {
    return null;
  }
};

const initializeOAuth2Client = () => {
  if (oAuth2Client) return oAuth2Client;

  const credentials = loadCredentials();
  oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  const token = loadToken();
  if (token) {
    oAuth2Client.setCredentials(token);
  }

  return oAuth2Client;
};

const createEmailMessage = (to, subject, htmlBody) => {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody
  ];

  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedEmail;
};

export const sendEmail = async (to, subject, htmlBody) => {
  try {
    const auth = initializeOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const encodedMessage = createEmailMessage(to, subject, htmlBody);

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log('Email sent successfully:', response.data.id);
    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    throw new Error('Failed to send email');
  }
};

export const getAuthUrl = () => {
  const auth = initializeOAuth2Client();
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  return authUrl;
};

export const generateTokenFromCode = async (code) => {
  const auth = initializeOAuth2Client();
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  return tokens;
};
