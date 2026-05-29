import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSheetsClient } from '../../../lib/google';

export const dynamic = 'force-dynamic';

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

export async function GET(request: Request) {
  try {
    const applicants = await prisma.applicant.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_SHEET_ID;

    // Helper map DB data into spreadsheet-style rows
    const formatRows = (list: any[]) => {
      return list.map((app, index) => ({
        rowNumber: index + 2,
        id: app.id,
        name: app.name,
        phone: app.phone,
        email: app.email,
        status: app.status,
        source: app.source,
        availability: getAvailabilityString(app.availability),
        appliedDate: new Date(app.createdAt).toLocaleDateString()
      }));
    };

    if (!hasCreds) {
      // Return offline simulation data
      return NextResponse.json({
        connected: false,
        spreadsheetId: '1T8rQ_S9U02Dk-X7y_p4zYxX474Y0q1m3oK0qW1-Mock',
        spreadsheetName: 'Libertydispatchers Delivery Drivers (Simulation)',
        sheetName: 'Applicants_Feed',
        lastSynced: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        headers: ['Row #', 'Applicant ID', 'Full Name', 'Phone', 'Email', 'Status', 'Source', 'Availability Hours', 'Applied Date'],
        rows: formatRows(applicants)
      });
    }

    // Connect to live Google Sheets and read spreadsheet info
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

    const sheetMeta = await sheets.spreadsheets.get({
      spreadsheetId
    });

    const spreadsheetName = sheetMeta.data.properties?.title || 'Libertydispatchers Drivers';
    const firstSheetName = sheetMeta.data.sheets?.[0]?.properties?.title || 'Sheet1';

    // Fetch existing values in the sheet
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${firstSheetName}!A1:I100`
    });

    const sheetValues = readRes.data.values || [];
    
    // Parse Google Sheet values into CRM rows
    const sheetRows = sheetValues.slice(1).map((row, index) => ({
      rowNumber: index + 2,
      id: row[1] || 'N/A',
      name: row[2] || 'N/A',
      phone: row[3] || 'N/A',
      email: row[4] || 'N/A',
      status: row[5] || 'N/A',
      source: row[6] || 'N/A',
      availability: row[7] || 'None',
      appliedDate: row[8] || 'N/A'
    }));

    return NextResponse.json({
      connected: true,
      spreadsheetId,
      spreadsheetName,
      sheetName: firstSheetName,
      lastSynced: new Date().toISOString(),
      headers: ['Row #', 'Applicant ID', 'Full Name', 'Phone', 'Email', 'Status', 'Source', 'Availability Hours', 'Applied Date'],
      rows: sheetRows.length > 0 ? sheetRows : formatRows(applicants)
    });

  } catch (error: any) {
    console.error('Error fetching live Sheets data:', error);
    // Graceful fallback to database rows if sheets fail
    const dbApplicants = await prisma.applicant.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({
      connected: false,
      error: error.message || 'Failed to sync with live Google Sheet',
      spreadsheetId: process.env.GOOGLE_SHEET_ID || '1T8rQ_S9U02Dk-X7y_p4zYxX474Y0q1m3oK0qW1-Mock',
      spreadsheetName: 'Libertydispatchers Delivery Drivers (Error Fallback)',
      sheetName: 'Applicants_Feed',
      headers: ['Row #', 'Applicant ID', 'Full Name', 'Phone', 'Email', 'Status', 'Source', 'Availability Hours', 'Applied Date'],
      rows: dbApplicants.map((app, index) => ({
        rowNumber: index + 2,
        id: app.id,
        name: app.name,
        phone: app.phone,
        email: app.email,
        status: app.status,
        source: app.source,
        availability: getAvailabilityString(app.availability),
        appliedDate: new Date(app.createdAt).toLocaleDateString()
      }))
    });
  }
}

export async function POST(request: Request) {
  try {
    const applicants = await prisma.applicant.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_SHEET_ID;

    const syncTime = new Date();

    if (hasCreds) {
      const sheets = getSheetsClient();
      const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
      
      // Determine tab sheet name dynamically
      const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
      const targetSheet = sheetMeta.data.sheets?.[0]?.properties?.title || 'Sheet1';

      // Build rows matching sheet columns
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

      // Perform a bulk update to write database rows cleanly
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${targetSheet}!A1:I${values.length}`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });
    }

    // Write synchronization event log notes to DB for all synced candidates
    for (const app of applicants) {
      await prisma.note.create({
        data: {
          content: `Synced applicant data to Google Sheets spreadsheet ${hasCreds ? '(Live Sheets updated)' : '(Mock simulation synced)'}`,
          applicantId: app.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      syncedCount: applicants.length,
      lastSynced: syncTime.toISOString(),
      connected: !!hasCreds
    });

  } catch (error: any) {
    console.error('Error running live Sheets sync:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete Sheets sync' }, { status: 500 });
  }
}
