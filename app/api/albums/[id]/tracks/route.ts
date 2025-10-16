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
    const { title, artist, playbackUrl, fileName } = await request.json();
    
    const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    const albumsData = JSON.parse(data);
    
    const album = albumsData.albums.find((a: any) => a.id === id);
    
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }
    
    const newTrack = {
      id: Date.now().toString(),
      title,
      artist: artist || album.artist,
      trackNumber: album.tracks.length + 1,
      audio_url: playbackUrl,
      playbackUrl: playbackUrl,
      source: 'ia',
      created_at: new Date().toISOString(),
      duration: '0:00',
      processing: true, // Mark as processing
    };
    
    album.tracks.push(newTrack);
    
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    
    return NextResponse.json({ success: true, track: newTrack });
  } catch (error) {
    console.error('Error adding track:', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}