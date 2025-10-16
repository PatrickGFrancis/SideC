import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALBUMS_FILE = path.join(process.cwd(), 'data', 'albums.json');
const TRASH_FILE = path.join(process.cwd(), 'data', 'trash.json');

// DELETE album (move to trash)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = fs.readFileSync(ALBUMS_FILE, 'utf-8');
    const albumsData = JSON.parse(data);
    
    const albumIndex = albumsData.albums.findIndex((a: any) => a.id === params.id);
    
    if (albumIndex === -1) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }
    
    // Get the album to delete
    const deletedAlbum = albumsData.albums[albumIndex];
    
    // Remove from albums
    albumsData.albums.splice(albumIndex, 1);
    fs.writeFileSync(ALBUMS_FILE, JSON.stringify(albumsData, null, 2));
    
    // Save to trash
    let trashData = { deleted: [] };
    if (fs.existsSync(TRASH_FILE)) {
      trashData = JSON.parse(fs.readFileSync(TRASH_FILE, 'utf-8'));
    }
    
    trashData.deleted.push({
      ...deletedAlbum,
      deletedAt: new Date().toISOString(),
    });
    
    fs.writeFileSync(TRASH_FILE, JSON.stringify(trashData, null, 2));
    
    return NextResponse.json({ success: true, albumId: params.id });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}