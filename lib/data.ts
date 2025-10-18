import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Album, AlbumWithTracks } from './types'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Cache user albums for 60 seconds
export const getAllAlbums = cache(async (): Promise<Album[]> => {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('albums')
    .select('id, title, artist, cover_url, release_date, description, created_at')
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
})

// Cache individual album with tracks
export const getAlbumById = cache(async (id: string): Promise<AlbumWithTracks | null> => {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Single optimized query with join instead of two separate queries
  const { data, error } = await supabase
    .from('albums')
    .select(`
      id,
      title,
      artist,
      cover_url,
      release_date,
      description,
      tracks (
        id,
        title,
        artist,
        track_number,
        audio_url,
        playback_url,
        duration,
        source,
        processing,
        created_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    console.error('Error fetching album:', error)
    return null
  }

  // Sort tracks on the client side to avoid another query
  const sortedTracks = (data.tracks || []).sort((a, b) => a.track_number - b.track_number)

  return {
    id: data.id,
    title: data.title,
    artist: data.artist,
    coverUrl: data.cover_url,
    releaseDate: data.release_date,
    description: data.description,
    tracks: sortedTracks.map(track => ({
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
})