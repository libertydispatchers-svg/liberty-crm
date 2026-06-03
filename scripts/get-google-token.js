const fs = require('fs');
const http = require('http');
const url = require('url');
const { google } = require('googleapis');

/**
 * INSTRUCTIONS:
 * 1. Go to Google Cloud Console (console.cloud.google.com).
 * 2. Create a Project and enable "Gmail API".
 * 3. Go to "APIs & Services" > "Credentials".
 * 4. Create an "OAuth Client ID" (Application type: "Web application").
 * 5. Add "http://localhost:3000" as an Authorized Redirect URI.
 * 6. Download the JSON file, rename it to "credentials.json", and place it in the root of this project.
 * 7. Run this script: `node scripts/get-google-token.js`
 */

const CREDENTIALS_PATH = './credentials.json';

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error('\n❌ credentials.json not found in the root directory.');
  console.error('Please download your OAuth client credentials from Google Cloud Console, save as credentials.json, and try again.\n');
  process.exit(1);
}

const keys = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
const clientConfig = keys.installed || keys.web;

if (!clientConfig) {
  console.error('Invalid credentials.json format.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientConfig.client_id,
  clientConfig.client_secret,
  'http://localhost:3000'
);

const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent' // Forces it to return a refresh token every time
});

console.log('\n=========================================');
console.log('🔗 Click this link to authorize the app:');
console.log('\n' + authUrl + '\n');
console.log('=========================================');
console.log('Waiting for authorization redirect on port 3000...');

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.indexOf('/?code=') > -1) {
      const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
      const code = qs.get('code');
      
      console.log('\n✅ Authorization code received. Exchanging for tokens...');
      res.end('Authentication successful! You can close this tab and return to the terminal.');
      server.close();
      
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('\n🎉 SUCCESS! Copy the following lines into your .env file:\n');
      console.log(`GOOGLE_CLIENT_ID="${clientConfig.client_id}"`);
      console.log(`GOOGLE_CLIENT_SECRET="${clientConfig.client_secret}"`);
      console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
      
      if (!tokens.refresh_token) {
        console.warn('\n⚠️ WARNING: No refresh token was returned. If you have authenticated before, you may need to go to https://myaccount.google.com/permissions, remove the app, and run this script again.');
      }
      
      console.log('\nAfter pasting these into .env, restart your Next.js server.');
      process.exit(0);
    }
  } catch (e) {
    console.error('Error during token exchange:', e);
    res.end('Authentication failed. Check terminal for details.');
    server.close();
    process.exit(1);
  }
}).listen(3000);
