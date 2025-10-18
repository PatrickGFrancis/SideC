"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TrackMenu } from "@/components/track-menu";
import { useAudio } from "@/contexts/audio-context";
import { Loader2 } from "lucide-react";

interface Track {
  id: string;
  title: string;
  audio_url?: string;
  playbackUrl?: string;
  artist?: string;
  source?: "local" | "ia";
  created_at: string;
  processing?: boolean;
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
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);

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

  const handlePlay = async (track: Track) => {
    if (track.processing) return;
    
    setLoadingTrack(track.id);
    
    try {
      await globalAudio.play(
        {
          ...track,
          albumTitle: albumTitle,
          albumId: albumId,
          coverUrl: coverUrl,
        },
        tracks.map((t) => ({
          ...t,
          albumTitle: albumTitle,
          albumId: albumId,
          coverUrl: coverUrl,
        }))
      );
    } finally {
      setLoadingTrack(null);
    }
  };

  // Preload track on hover
  const handleMouseEnter = (track: Track) => {
    if (!track.processing && track.id !== globalAudio.currentTrack?.id) {
      globalAudio.preload({
        ...track,
        albumTitle: albumTitle,
        albumId: albumId,
        coverUrl: coverUrl,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-sans text-lg font-semibold text-foreground/90">Tracks</h3>
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isProcessing = track.processing === true;
            const isCurrentTrack = globalAudio.currentTrack?.id === track.id;
            const isPlaying = isCurrentTrack && globalAudio.isPlaying;
            const isLoading = loadingTrack === track.id;

            return (
              <div
                key={track.id}
                className={cn(
                  "group w-full rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer",
                  "hover:bg-secondary/50 hover:scale-[1.01] active:scale-[0.99]",
                  isCurrentTrack && "bg-secondary border border-primary/20 glow-primary",
                  (isProcessing || isLoading) && "opacity-50 cursor-not-allowed hover:scale-100"
                )}
                onClick={() => !isProcessing && !isLoading && handlePlay(track)}
                onMouseEnter={() => handleMouseEnter(track)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground flex-shrink-0 font-mono">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className={cn(
                          "font-medium truncate transition-colors",
                          isCurrentTrack ? "text-primary" : "text-foreground"
                        )}
                      >
                        {track.title}
                      </span>
                      {isProcessing && (
                        <span className="text-xs text-muted-foreground">
                          Processing on Internet Archive...
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {isPlaying && !isProcessing && !isLoading && (
                      <div className="flex gap-1">
                        <div className="h-3 w-1 animate-pulse bg-primary rounded-full" />
                        <div className="h-3 w-1 animate-pulse bg-primary rounded-full delay-75" />
                        <div className="h-3 w-1 animate-pulse bg-primary rounded-full delay-150" />
                      </div>
                    )}
                    {isProcessing && (
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full animate-bounce bg-muted-foreground" />
                        <div
                          className="h-2 w-2 rounded-full animate-bounce bg-muted-foreground"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full animate-bounce bg-muted-foreground"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    )}
                    {/* Stop propagation on menu to prevent track click */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <TrackMenu
                        albumId={albumId}
                        trackId={track.id}
                        trackTitle={track.title}
                        playbackUrl={track.playbackUrl}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}