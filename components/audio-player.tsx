"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/contexts/audio-context";
import { SortableTrackList } from "@/components/sortable-track-list";

interface Track {
  id: string;
  title: string;
  audio_url?: string;
  playbackUrl?: string;
  artist?: string;
  source?: "local" | "ia";
  created_at: string;
  processing?: boolean;
  order: number;
}

interface AudioPlayerProps {
  tracks: Track[];
  albumTitle: string;
  albumId: string;
  coverUrl?: string;
}

export function AudioPlayer({ tracks, albumTitle, albumId, coverUrl }: AudioPlayerProps) {
  const globalAudio = useAudio();
  const prevTracksRef = useRef<string>("");

  useEffect(() => {
    const currentTracksIds = tracks.map((t) => t.id).join(",");

    if (
      globalAudio.currentTrack?.albumId === albumId &&
      tracks.length > 0 &&
      prevTracksRef.current !== currentTracksIds
    ) {
      prevTracksRef.current = currentTracksIds;
      globalAudio.updatePlaylist(
        tracks.map((t) => ({
          ...t,
          albumTitle: albumTitle,
          albumId: albumId,
          coverUrl: coverUrl,
        }))
      );
    }
  }, [tracks, albumId, albumTitle, coverUrl, globalAudio]);

  const handlePlay = async (track: Track, trackList: Track[]) => {
    if (track.processing) return;
    
    await globalAudio.play(
      {
        ...track,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      },
      trackList.map((t) => ({
        ...t,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      }))
    );
  };

  // Sort tracks by order
  const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-sans text-lg font-semibold text-foreground/90">Tracks</h3>
        <SortableTrackList
          tracks={sortedTracks}
          albumId={albumId}
          albumTitle={albumTitle}
          coverUrl={coverUrl}
          onPlay={handlePlay}
        />
      </div>
    </div>
  );
}