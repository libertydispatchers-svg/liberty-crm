import { prisma } from './prisma';
import { getSheetsClient } from './google';

function getAvailabilityString(availabilityJson: string) {
  try {
    const availObj = JSON.parse(availabilityJson);
    const activeDays = Object.entries(availObj)
      .filter(([_, slots]: any) => slots.length > 0)
      .map(([day, slots]: any) => `${day.substring(0, 3)} (${slots.join(',')})`);
    return activeDays.length > 0 ? activeDays.join(' | ') : 'None';
  } catch (e) {
    return 'None';
  }
}

export async function syncToSheets() {
  try {
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_SHEET_ID;

    if (!hasCreds) {
      console.warn('Google Sheets sync skipped: missing environment variables.');
      return false;
    }

    const applicants = await prisma.applicant.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
    
    // Get the first sheet tab name dynamically
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = sheetMeta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    // Clear range A1:I500 first to avoid leftover rows from deleted candidates
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${targetSheet}!A1:I500`,
    });

    const headers = ['Row #', 'Applicant ID', 'Full Name', 'Phone', 'Email', 'Status', 'Source', 'Availability Hours', 'Applied Date'];
    
    const values = [
      headers,
      ...applicants.map((app, index) => [
        index + 2,
        app.id,
        app.name,
        app.phone,
        app.email,
        app.status,
        app.source,
        getAvailabilityString(app.availability),
        new Date(app.createdAt).toLocaleDateString()
      ])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${targetSheet}!A1:I${values.length}`,
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    console.log('Successfully synced database to Google Sheets.');
    return true;
  } catch (error) {
    console.error('Failed to sync database to Google Sheets:', error);
    return false;
  }
}

export async function pullFromSheets() {
  try {
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_SHEET_ID;

    if (!hasCreds) {
      throw new Error('Missing Google credentials');
    }

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
    
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = sheetMeta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${targetSheet}!A2:I500`, // Skip header row
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in Google Sheets to pull.');
      return true;
    }

    // Headers: 'Row #', 'Applicant ID', 'Full Name', 'Phone', 'Email', 'Status', 'Source', 'Availability Hours', 'Applied Date'
    for (const row of rows) {
      const id = row[1];
      const name = row[2];
      const phone = row[3];
      const email = row[4];
      const status = row[5];
      const source = row[6];

      if (!id || id.trim() === '') continue;

      // Ensure the record exists before trying to update
      const existing = await prisma.applicant.findUnique({ where: { id } });
      if (existing) {
        // Only update basic fields that a manager might edit in a spreadsheet
        await prisma.applicant.update({
          where: { id },
          data: {
            name: name || existing.name,
            phone: phone || existing.phone,
            email: email || existing.email,
            status: status || existing.status,
            source: source || existing.source,
          }
        });
      }
    }

    console.log('Successfully pulled database from Google Sheets.');
    return true;
  } catch (error) {
    console.error('Failed to pull from Google Sheets:', error);
    return false;
  }
}
