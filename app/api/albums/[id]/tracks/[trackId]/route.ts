import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALBUMS_FILE = path.join(process.cwd(), 'data', 'albums.json');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const { id, trackId } = await params;
    
    const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    const albumsData = JSON.parse(data);
    
    const album = albumsData.albums.find((a: any) => a.id === id);
    
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }
    
    const trackIndex = album.tracks.findIndex((t: any) => t.id === trackId);
    
    if (trackIndex === -1) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    
    // Remove track
    album.tracks.splice(trackIndex, 1);
    
    // Re-number remaining tracks
    album.tracks.forEach((track: any, index: number) => {
      track.trackNumber = index + 1;
    });
    
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
  }
}