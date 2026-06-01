const { google } = require('googleapis');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function getSecret(name) {
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({ name: `projects/736433125033/secrets/${name}/versions/latest` });
  return version.payload.data.toString('utf8');
}

async function run() {
  const GOOGLE_CLIENT_ID = await getSecret('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = await getSecret('GOOGLE_CLIENT_SECRET');
  const GOOGLE_REFRESH_TOKEN = await getSecret('GOOGLE_REFRESH_TOKEN');

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10,
    q: 'newer_than:1d'
  });

  if (!res.data.messages) {
    console.log("No messages today.");
    return;
  }

  for (const m of res.data.messages) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata' });
    const headers = msg.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value;
    const from = headers.find(h => h.name === 'From')?.value;
    console.log(`From: ${from} | Subject: ${subject}`);
  }
}

run().catch(console.error);
