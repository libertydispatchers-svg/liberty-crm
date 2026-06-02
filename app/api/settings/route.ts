import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    
    for (const s of dbSettings) {
      settingsMap[s.key] = s.value;
    }

    // Return merged DB settings and system env fallbacks
    return NextResponse.json({
      success: true,
      settings: {
        WHATSAPP_NUMBER: settingsMap['WHATSAPP_NUMBER'] || process.env.WHATSAPP_NUMBER || '+1 (516) 497-4669',
        DISPATCHER_PHONE_NUMBER: settingsMap['DISPATCHER_PHONE_NUMBER'] || process.env.DISPATCHER_PHONE_NUMBER || '+14106354001',
        GOOGLE_SHEET_ID: settingsMap['GOOGLE_SHEET_ID'] || process.env.GOOGLE_SHEET_ID || '15vJCu-X-0oeYXT7O-iJKpPPT2pv94smM-AFnN5HlT4s'
      }
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    // If DB is offline, fall back to environment variables gracefully
    return NextResponse.json({
      success: false,
      error: error.message || 'Database error, using defaults',
      settings: {
        WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER || '+1 (516) 497-4669',
        DISPATCHER_PHONE_NUMBER: process.env.DISPATCHER_PHONE_NUMBER || '+14106354001',
        GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '15vJCu-X-0oeYXT7O-iJKpPPT2pv94smM-AFnN5HlT4s'
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const { settings } = await request.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    // Upsert each setting key/value pair into the database
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'string') continue;
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
