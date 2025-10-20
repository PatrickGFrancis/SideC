import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get album with tracks
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select(`
        *,
        tracks (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...album,
      tracks: album.tracks || []
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, artist, description, releaseDate } = await request.json()

    // Update album
    const { error: updateError } = await supabase
      .from('albums')
      .update({
        title,
        artist,
        description,
        release_date: releaseDate,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating album:', updateError)
      return NextResponse.json({ error: 'Failed to update album' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the album with cover info
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('cover_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Delete album cover from storage if it exists
    if (album.cover_url && album.cover_url.includes('album-covers')) {
      try {
        const fileName = album.cover_url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('album-covers')
            .remove([fileName])
        }
      } catch (error) {
        console.error('Error deleting album cover:', error)
        // Continue anyway - don't fail the deletion
      }
    }

    // Delete album (tracks will cascade delete automatically)
    const { error: deleteError } = await supabase
      .from('albums')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting album:', deleteError)
      return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}