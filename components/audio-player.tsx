"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/contexts/audio-context";
import { SortableTrackList } from "@/components/sortable-track-list";
import { Button } from "@/components/ui/button";
import { Play, Shuffle } from "lucide-react";

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
  isGuest?: boolean;
}

export function AudioPlayer({ 
  tracks, 
  albumTitle, 
  albumId, 
  coverUrl,
  isGuest = false 
}: AudioPlayerProps) {
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

  const handlePlayAll = async () => {
    const playableTracks = sortedTracks.filter(t => !t.processing);
    if (playableTracks.length === 0) return;

    const firstTrack = playableTracks[0];
    await globalAudio.play(
      {
        ...firstTrack,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      },
      playableTracks.map((t) => ({
        ...t,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      }))
    );
  };

  const handleShufflePlay = async () => {
    const playableTracks = sortedTracks.filter(t => !t.processing);
    if (playableTracks.length === 0) return;

    // Shuffle the tracks
    const shuffled = [...playableTracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const firstTrack = shuffled[0];
    await globalAudio.play(
      {
        ...firstTrack,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      },
      shuffled.map((t) => ({
        ...t,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      }))
    );
  };

  // Sort tracks by order
  const sortedTracks = [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));
  const hasPlayableTracks = sortedTracks.some(t => !t.processing);

  return (
    <div className="space-y-6">
      {/* Play Controls */}
      {hasPlayableTracks && (
        <div className="flex gap-3">
          <Button
            onClick={handlePlayAll}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            Play
          </Button>
          <Button
            onClick={handleShufflePlay}
            variant="outline"
            className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary transition-all hover:scale-105 active:scale-95"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-sans text-lg font-semibold text-foreground/90">Tracks</h3>
        <SortableTrackList
          tracks={sortedTracks}
          albumId={albumId}
          albumTitle={albumTitle}
          coverUrl={coverUrl}
          onPlay={handlePlay}
          isGuest={isGuest}
        />
      </div>
    </div>
  );
}