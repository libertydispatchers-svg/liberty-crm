import { NextResponse } from 'next/server';
import { getSheetsClient } from '../../../../lib/google';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const hasCreds = 
      process.env.GOOGLE_CLIENT_ID && 
      process.env.GOOGLE_CLIENT_SECRET && 
      process.env.GOOGLE_REFRESH_TOKEN;

    if (!hasCreds) {
      return NextResponse.json({ error: 'Missing Google OAuth credentials' }, { status: 400 });
    }

    const sheets = getSheetsClient();
    
    // Create new spreadsheet
    const newSpreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Liberty Dispatchers CRM - ${new Date().toLocaleDateString()}`
        }
      }
    });

    const spreadsheetId = newSpreadsheet.data.spreadsheetId;

    if (!spreadsheetId) {
      throw new Error('Failed to retrieve spreadsheet ID from Google');
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: newSpreadsheet.data.spreadsheetUrl,
      message: `Successfully created! Please add this GOOGLE_SHEET_ID to your Vercel Environment Variables: ${spreadsheetId}`
    });

  } catch (error: any) {
    console.error('Error creating Google Sheet:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sheet' }, { status: 500 });
  }
}
