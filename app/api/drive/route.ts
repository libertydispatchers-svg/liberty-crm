import { NextResponse } from 'next/server';
import { getDriveClient } from '../../../lib/google';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicantName, docName, esignData, signedAt } = body;

    const drive = getDriveClient();
    
    // Create a text representation of the document
    let content = `Document: ${docName}\nApplicant: ${applicantName}\nSigned At: ${new Date(signedAt).toLocaleString()}\n\n--- SIGNATURE & DATA ---\n\n`;
    
    if (esignData) {
      try {
        const parsed = JSON.parse(esignData);
        for (const [key, value] of Object.entries(parsed)) {
          content += `${key.toUpperCase()}: ${value}\n`;
        }
      } catch {
        content += esignData;
      }
    } else {
      content += "No signature data provided.";
    }

    const fileMetadata = {
      name: `${applicantName.replace(/[^a-zA-Z0-9 ]/g, '')} - ${docName} (Signed).txt`,
      mimeType: 'text/plain',
    };

    const media = {
      mimeType: 'text/plain',
      body: content,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return NextResponse.json({ 
      success: true, 
      fileId: file.data.id,
      webViewLink: file.data.webViewLink
    });

  } catch (error: any) {
    console.error('Google Drive API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload to Google Drive' }, { status: 500 });
  }
}
