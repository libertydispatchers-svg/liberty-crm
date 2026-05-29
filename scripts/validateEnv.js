// scripts/validateEnv.js
// Simple Node script to ensure all required Google env vars are defined before running the app.
const required = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_SHEET_ID',
  'DISPATCHER_PHONE_NUMBER'
];

let missing = [];
for (const key of required) {
  if (!process.env[key]) missing.push(key);
}

if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All required Google env vars are present.');
process.exit(0);
