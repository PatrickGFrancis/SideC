import { createClient } from "@/lib/supabase/server";

export async function getAllPlaylists() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: playlists, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching playlists:", error);
    return [];
  }

  return playlists || [];
}

export async function getPlaylistById(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get playlist
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (playlistError || !playlist) {
    console.error("Error fetching playlist:", playlistError);
    return null;
  }

  // Get tracks in playlist
  const { data: playlistTracks, error: tracksError } = await supabase
    .from("playlist_tracks")
    .select(
      `
      order,
      tracks (
        id,
        title,
        artist,
        duration,
        playbackUrl:playback_url,
        audio_url,
        processing,
        albums (
          id,
          title,
          coverUrl:cover_url
        )
      )
    `
    )
    .eq("playlist_id", id)
    .order("order", { ascending: true });

  if (tracksError) {
    console.error("Error fetching playlist tracks:", tracksError);
    return { ...playlist, tracks: [] };
  }

  // Transform the data
  const tracks = (playlistTracks || []).map((pt: any) => ({
    id: pt.tracks.id,
    title: pt.tracks.title,
    artist: pt.tracks.artist,
    duration: pt.tracks.duration,
    playbackUrl: pt.tracks.playbackUrl,
    audio_url: pt.tracks.audio_url,
    processing: pt.tracks.processing,
    order: pt.order,
    albumId: pt.tracks.albums?.id,
    albumTitle: pt.tracks.albums?.title,
    coverUrl: pt.tracks.albums?.coverUrl,
  }));

  return {
    ...playlist,
    tracks,
  };
}