import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const iaAccessKey = formData.get('iaUsername') as string;
    const iaSecretKey = formData.get('iaPassword') as string;
    const rawTitle = formData.get('title') as string;
    const rawArtist = formData.get('artist') as string;

    if (!file || !iaAccessKey || !iaSecretKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Attempting upload with access key:', iaAccessKey);

    // Sanitize function for ASCII-only strings
    const sanitizeForHeader = (str: string) => {
      return str
        .replace(/['']/g, "'")  // Replace curly quotes with straight quotes
        .replace(/[""]/g, '"')   // Replace curly double quotes
        .replace(/[^\x00-\x7F]/g, '');  // Remove any non-ASCII characters
    };

    // Sanitize metadata
    const title = sanitizeForHeader(rawTitle || file.name);
    const artist = sanitizeForHeader(rawArtist || 'Unknown Artist');

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename - remove special characters
    const sanitizedFileName = file.name
      .replace(/['']/g, "'")  // Replace curly quotes with straight quotes
      .replace(/[""]/g, '"')   // Replace curly double quotes
      .replace(/[^\x00-\x7F]/g, '')  // Remove any non-ASCII characters
      .replace(/[^a-zA-Z0-9._-]/g, '_');  // Replace other special chars with underscore

    // Generate unique identifier for IA
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    const iaIdentifier = `music_${timestamp}_${random}`;
    
    // Upload to Internet Archive S3 API using LOW authorization
    const uploadUrl = `https://s3.us.archive.org/${iaIdentifier}/${encodeURIComponent(sanitizedFileName)}`;
    
    console.log('Uploading to:', uploadUrl);
    console.log('Sanitized title:', title);
    console.log('Sanitized artist:', artist);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `LOW ${iaAccessKey}:${iaSecretKey}`,
        'x-archive-meta-mediatype': 'audio',
        'x-archive-meta-collection': 'opensource_audio',
        'x-archive-meta-title': title,
        'x-archive-meta-creator': artist,
        'x-archive-auto-make-bucket': '1',
      },
      body: buffer,
    });

    const responseText = await uploadResponse.text();
    console.log('IA Response:', uploadResponse.status, responseText);

    if (!uploadResponse.ok) {
      console.error('IA upload failed:', responseText);
      return NextResponse.json({ 
        error: 'Upload to Internet Archive failed',
        details: responseText 
      }, { status: 500 });
    }

    const playbackUrl = `https://archive.org/download/${iaIdentifier}/${sanitizedFileName}`;

    return NextResponse.json({
      success: true,
      identifier: iaIdentifier,
      playbackUrl: playbackUrl,
      fileName: sanitizedFileName,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}