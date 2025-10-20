"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";
import { TrackMenu } from "@/components/track-menu";
import { useAudio } from "@/contexts/audio-context";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  artist?: string;
  playbackUrl?: string;
  audio_url?: string;
  processing?: boolean;
  duration?: number | string; // Accept both
}

interface SortableTrackItemProps {
  track: Track;
  index: number;
  albumId: string;
  albumTitle: string;
  coverUrl?: string;
  onPlay: () => void;
  disabled?: boolean;
}

// Helper to format duration
function formatDuration(duration: number | string | undefined): string {
  console.log("formatDuration input:", duration, "type:", typeof duration);

  if (!duration) return "--:--";

  // Convert string numbers to actual numbers
  let durationNum: number;

  if (typeof duration === "string") {
    // If it's already formatted like "3:45", return it
    if (duration.includes(":")) {
      return duration === "0:00" ? "--:--" : duration;
    }
    // Otherwise, parse it as a number
    durationNum = parseInt(duration, 10);
    console.log("Parsed string to number:", durationNum);
  } else {
    durationNum = duration;
  }

  // Now format the number
  if (durationNum === 0 || isNaN(durationNum)) {
    console.log("Duration is 0 or NaN, returning --:--");
    return "--:--";
  }

  const mins = Math.floor(durationNum / 60);
  const secs = durationNum % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;
  console.log("Formatted result:", formatted);
  return formatted;
}

export function SortableTrackItem({
  track,
  index,
  albumId,
  albumTitle,
  coverUrl,
  onPlay,
  disabled,
}: SortableTrackItemProps) {
  const { currentTrack, isPlaying, preload } = useAudio();
  const [isLoading, setIsLoading] = useState(false);
  const isProcessing = track.processing === true;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlayingTrack = isCurrentTrack && isPlaying;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id, disabled: disabled || isProcessing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = async () => {
    if (isProcessing || isLoading) return;

    setIsLoading(true);
    try {
      await onPlay();
    } finally {
      setIsLoading(false);
    }
  };

  // Preload track on hover
  const handleMouseEnter = () => {
    if (!isProcessing && track.id !== currentTrack?.id) {
      preload({
        ...track,
        albumTitle,
        albumId,
        coverUrl,
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group w-full rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer",
        "hover:bg-secondary/50 hover:scale-[1.01] active:scale-[0.99]",
        isCurrentTrack && "bg-secondary border border-primary/20 glow-primary",
        (isProcessing || isLoading) &&
          "opacity-50 cursor-not-allowed hover:scale-100",
        isDragging && "opacity-50 shadow-xl z-50 scale-105"
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none opacity-0 group-hover:opacity-100",
              disabled && "opacity-50 cursor-not-allowed",
              isDragging && "opacity-100"
            )}
            disabled={disabled || isProcessing}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Track number */}
          <span className="text-sm text-muted-foreground flex-shrink-0 font-mono w-6 text-center">
            {(index + 1).toString().padStart(2, "0")}
          </span>

          {/* Track info */}
          <div className="flex flex-col flex-1 min-w-0">
            <span
              className={cn(
                "font-medium truncate transition-colors",
                isCurrentTrack ? "text-primary" : "text-foreground"
              )}
            >
              {track.title}
            </span>
            {track.artist && (
              <span className="text-sm text-muted-foreground truncate">
                {track.artist}
              </span>
            )}
            {isProcessing && (
              <span className="text-xs text-muted-foreground">
                Processing on Internet Archive...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Processing animation */}
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

          {/* Show playing animation OR duration */}
          {isPlayingTrack && !isProcessing && !isLoading ? (
            <div className="flex gap-1">
              <div className="h-3 w-1 animate-pulse bg-primary rounded-full" />
              <div className="h-3 w-1 animate-pulse bg-primary rounded-full delay-75" />
              <div className="h-3 w-1 animate-pulse bg-primary rounded-full delay-150" />
            </div>
          ) : (
            !isProcessing && (
              <span className="text-sm text-muted-foreground font-mono tabular-nums">
                {formatDuration(track.duration)}
              </span>
            )
          )}

          {/* Loading spinner */}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}

          {/* Track menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <TrackMenu
              albumId={albumId}
              trackId={track.id}
              trackTitle={track.title}
              playbackUrl={track.playbackUrl || track.audio_url}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
