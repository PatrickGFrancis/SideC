import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

    const { title, artist, playbackUrl, fileName } = await request.json()

    // Verify album belongs to user
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('id, artist')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (albumError || !album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // Get current track count for track number
    const { count } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .eq('album_id', id)

    const trackNumber = (count || 0) + 1

    // Insert track
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        album_id: id,
        title,
        artist: artist || album.artist,
        track_number: trackNumber,
        playback_url: playbackUrl,
        audio_url: playbackUrl,
        source: 'ia',
        processing: true,
        duration: '0:00',
      })
      .select()
      .single()

    if (trackError) {
      console.error('Error creating track:', trackError)
      return NextResponse.json({ error: 'Failed to create track' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        trackNumber: track.track_number,
        playbackUrl: track.playback_url,
        processing: track.processing,
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
