export interface Album {
  id: string
  title: string
  artist: string
  coverUrl: string
  releaseDate: string
  description: string
}

export interface Track {
  id: string
  title: string
  trackNumber: number
  audioUrl?: string
  audio_url?: string
  playbackUrl?: string
  duration?: string
  artist?: string
  source?: string
  created_at?: string
  processing?: boolean // New field for IA processing status
}

export interface AlbumWithTracks extends Album {
  tracks: Track[]
}