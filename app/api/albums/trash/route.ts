import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TRASH_FILE = path.join(process.cwd(), 'data', 'trash.json');

export async function GET() {
  try {
    if (!fs.existsSync(TRASH_FILE)) {
      return NextResponse.json({ deleted: [] });
    }
    
    const data = fs.readFileSync(TRASH_FILE, 'utf-8');
    const trashData = JSON.parse(data);
    
    // Return only recent deletions (last 10)
    const recentDeleted = trashData.deleted.slice(-10).reverse();
    
    return NextResponse.json({ deleted: recentDeleted });
  } catch (error) {
    console.error('Error fetching trash:', error);
    return NextResponse.json({ deleted: [] });
  }
}