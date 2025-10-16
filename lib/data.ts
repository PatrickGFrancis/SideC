import albumsData from "@/data/albums.json"
import type { Album, AlbumWithTracks } from "./types"

export function getAllAlbums(): Album[] {
  return albumsData.albums
}

export function getAlbumById(id: string): AlbumWithTracks | null {
  const album = albumsData.albums.find((a) => a.id === id)
  return album || null
}
