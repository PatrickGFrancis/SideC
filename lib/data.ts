import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Album, AlbumWithTracks } from './types'

export async function getAllAlbums(): Promise<Album[]> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching albums:', error)
    return []
  }

  return data.map(album => ({
    id: album.id,
    title: album.title,
    artist: album.artist,
    coverUrl: album.cover_url,
    releaseDate: album.release_date,
    description: album.description,
  }))
}

export async function getAlbumById(id: string): Promise<AlbumWithTracks | null> {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (albumError || !album) {
    console.error('Error fetching album:', albumError)
    return null
  }

  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('*')
    .eq('album_id', id)
    .order('track_number', { ascending: true })

  if (tracksError) {
    console.error('Error fetching tracks:', tracksError)
    return null
  }

  return {
    id: album.id,
    title: album.title,
    artist: album.artist,
    coverUrl: album.cover_url,
    releaseDate: album.release_date,
    description: album.description,
    tracks: tracks.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      trackNumber: track.track_number,
      audio_url: track.audio_url,
      playbackUrl: track.playback_url,
      duration: track.duration,
      source: track.source,
      processing: track.processing,
      created_at: track.created_at,
    }))
  }
}