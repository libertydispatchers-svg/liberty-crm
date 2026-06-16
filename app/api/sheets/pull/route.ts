import { NextResponse } from 'next/server';
import { pullFromSheets } from '../../../../lib/sheets';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const success = await pullFromSheets();
    if (success) {
      return NextResponse.json({ success: true, message: 'Pulled successfully from Google Sheets' });
    } else {
      return NextResponse.json({ error: 'Failed to pull from sheets' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
