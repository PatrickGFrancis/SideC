import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALBUMS_FILE = path.join(process.cwd(), 'data', 'albums.json');

// GET all albums
export async function GET() {
  try {
    const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    const albums = JSON.parse(data);
    return NextResponse.json(albums);
  } catch (error) {
    return NextResponse.json({ albums: [] });
  }
}

// POST create new album
export async function POST(request: NextRequest) {
  try {
    const { title, artist, coverArt } = await request.json();
    
    const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    const albumsData = JSON.parse(data);
    
    const newAlbum = {
      id: Date.now().toString(),
      title,
      artist: artist || 'Unknown Artist',
      coverUrl: coverArt || '/placeholder.svg?height=400&width=400',
      releaseDate: new Date().toISOString().split('T')[0],
      description: '',
      tracks: [],
    };
    
    albumsData.albums.push(newAlbum);
    
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    
    return NextResponse.json({ success: true, album: newAlbum });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}