"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { DeleteTrack } from "@/components/delete-track";
import { useAudio } from "@/contexts/audio-context";

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
  coverUrl?: string; // Add this
}

export function AudioPlayer({ tracks, albumTitle, albumId, coverUrl }: AudioPlayerProps) {
  const globalAudio = useAudio();
  const prevTracksRef = useRef<string>("");

  // Update playlist when tracks change (new track added/deleted)
  useEffect(() => {
    const currentTracksIds = tracks.map(t => t.id).join(",");
    
    // Only update if tracks actually changed and this is the current album
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
          coverUrl: coverUrl, // Add cover URL
        }))
      );
    }
  }, [tracks, albumId, albumTitle, coverUrl, globalAudio]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-sans text-lg font-semibold">Tracks</h3>
        <div className="space-y-1">
          {tracks.map((track, index) => {
            const isProcessing = track.processing === true;
            const isCurrentTrack = globalAudio.currentTrack?.id === track.id;
            const isPlaying = isCurrentTrack && globalAudio.isPlaying;

            return (
              <div
                key={track.id}
                className={cn(
                  "group w-full rounded-lg px-4 py-3 transition-colors hover:bg-accent",
                  isCurrentTrack && "bg-accent",
                  isProcessing && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (!isProcessing) {
                        globalAudio.play(
                          {
                            ...track,
                            albumTitle: albumTitle,
                            albumId: albumId,
                            coverUrl: coverUrl, // Add cover URL
                          },
                          tracks.map((t) => ({
                            ...t,
                            albumTitle: albumTitle,
                            albumId: albumId,
                            coverUrl: coverUrl, // Add cover URL
                          }))
                        );
                      }
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <span className="text-sm text-muted-foreground flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className={cn(
                          "font-medium truncate",
                          isCurrentTrack && "text-primary"
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
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPlaying && !isProcessing && (
                      <div className="flex gap-1">
                        <div className="h-3 w-1 animate-pulse bg-primary" />
                        <div className="h-3 w-1 animate-pulse bg-primary delay-75" />
                        <div className="h-3 w-1 animate-pulse bg-primary delay-150" />
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
                    <DeleteTrack
                      albumId={albumId}
                      trackId={track.id}
                      trackTitle={track.title}
                    />
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