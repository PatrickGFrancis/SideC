import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALBUMS_FILE = path.join(process.cwd(), 'data', 'albums.json');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('cover') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64 to store in JSON
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Update album cover in JSON
    const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    const albumsData = JSON.parse(data);
    
    const album = albumsData.albums.find((a: any) => a.id === id);
    
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }
    
    album.coverUrl = dataUrl;
    
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    
    return NextResponse.json({ success: true, coverUrl: dataUrl });
  } catch (error) {
    console.error('Error uploading cover:', error);
    return NextResponse.json({ error: 'Failed to upload cover' }, { status: 500 });
  }
}