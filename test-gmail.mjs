import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function run() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  try {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'label:INBOX',
      maxResults: 25
    });
    console.log('Messages count:', listRes.data.messages?.length);
  } catch (err) {
    console.error('API Error:', err.message);
  }
}
run();
