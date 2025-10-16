import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALBUMS_FILE = path.join(process.cwd(), 'data', 'albums.json');
const TRASH_FILE = path.join(process.cwd(), 'data', 'trash.json');

export async function POST(request: NextRequest) {
  try {
    const { albumId } = await request.json();
    
    if (!fs.existsSync(TRASH_FILE)) {
      return NextResponse.json({ error: 'No deleted albums found' }, { status: 404 });
    }
    
    const trashData = JSON.parse(fs.readFileSync(TRASH_FILE, 'utf-8'));
    const albumIndex = trashData.deleted.findIndex((a: any) => a.id === albumId);
    
    if (albumIndex === -1) {
      return NextResponse.json({ error: 'Album not found in trash' }, { status: 404 });
    }
    
    // Get the album from trash
    const restoredAlbum = trashData.deleted[albumIndex];
    delete restoredAlbum.deletedAt; // Remove the deletedAt timestamp
    
    // Remove from trash
    trashData.deleted.splice(albumIndex, 1);
    fs.writeFileSync(TRASH_FILE, JSON.stringify(trashData, null, 2));
    
    // Add back to albums
    const albumsData = JSON.parse(fs.readFileSync(ALBUMS_FILE, 'utf-8'));
    albumsData.albums.push(restoredAlbum);
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    
    return NextResponse.json({ success: true, album: restoredAlbum });
  } catch (error) {
    console.error('Error restoring album:', error);
    return NextResponse.json({ error: 'Failed to restore album' }, { status: 500 });
  }
}