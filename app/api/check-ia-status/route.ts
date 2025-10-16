import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALBUMS_FILE = path.join(process.cwd(), 'data', 'albums.json');

export async function POST(request: NextRequest) {
  try {
    const { trackId, playbackUrl } = await request.json();
    
    // Check if the IA URL is accessible
    const response = await fetch(playbackUrl, { method: 'HEAD' });
    
    const isReady = response.ok;
    
    if (isReady) {
      // Update the track in albums.json to mark it as ready
      const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
      const albumsData = JSON.parse(data);
      
      // Find and update the track
      for (const album of albumsData.albums) {
        const track = album.tracks.find((t: any) => t.id === trackId);
        if (track) {
          track.processing = false;
          break;
        }
      }
      
      fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    }
    
    return NextResponse.json({ ready: isReady });
  } catch (error) {
    console.error('Error checking IA status:', error);
    return NextResponse.json({ ready: false });
  }
}