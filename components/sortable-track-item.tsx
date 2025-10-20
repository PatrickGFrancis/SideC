"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Upload } from "lucide-react";
import { TrackMenu } from "@/components/track-menu";
import { useAudio } from "@/contexts/audio-context";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Track {
  id: string;
  title: string;
  artist?: string;
  playbackUrl?: string;
  audio_url?: string;
  processing?: boolean;
  duration?: number | string;
  // Optimistic upload properties
  isUploading?: boolean;
  uploadProgress?: number;
}

interface SortableTrackItemProps {
  track: Track;
  index: number;
  albumId: string;
  albumTitle: string;
  coverUrl?: string;
  onPlay: () => void;
  disabled?: boolean;
  isDeleting?: boolean;
  onDelete?: (trackId: string) => void;
}

// Helper to format duration
function formatDuration(duration: number | string | undefined): string {
  if (!duration) return "--:--";

  let durationNum: number;

  if (typeof duration === "string") {
    if (duration.includes(":")) {
      return duration === "0:00" ? "--:--" : duration;
    }
    durationNum = parseInt(duration, 10);
  } else {
    durationNum = duration;
  }

  if (durationNum === 0 || isNaN(durationNum)) {
    return "--:--";
  }

  const mins = Math.floor(durationNum / 60);
  const secs = durationNum % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function SortableTrackItem({
  track,
  index,
  albumId,
  albumTitle,
  coverUrl,
  onPlay,
  disabled,
  isDeleting = false,
  onDelete,
}: SortableTrackItemProps) {
  const { currentTrack, isPlaying, preload } = useAudio();
  const [isLoading, setIsLoading] = useState(false);
  const isProcessing = track.processing === true;
  const isUploading = track.isUploading === true;
  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlayingTrack = isCurrentTrack && isPlaying;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: track.id,
    disabled: disabled || isProcessing || isDeleting || isUploading,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDeleting ? "all 0.3s ease-out" : transition,
  };

  const handleClick = async () => {
    if (isProcessing || isLoading || isDeleting || isUploading) return;

    setIsLoading(true);
    try {
      await onPlay();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (
      !isProcessing &&
      !isDeleting &&
      !isUploading &&
      track.id !== currentTrack?.id
    ) {
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
        "group w-full rounded-xl px-4 py-3 transition-all duration-200",
        !isUploading &&
          "cursor-pointer hover:bg-secondary/50 hover:scale-[1.01] active:scale-[0.99]",
        isCurrentTrack && "bg-secondary border border-primary/20 glow-primary",
        (isProcessing || isLoading) &&
          "opacity-50 cursor-not-allowed hover:scale-100",
        isUploading &&
          "bg-secondary/30 border border-primary/30 cursor-default",
        isDragging && "opacity-50 shadow-xl z-50 scale-105",
        isDeleting && "opacity-0 scale-95 -translate-x-4 pointer-events-none"
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Drag handle or Upload icon */}
          {isUploading ? (
            <Upload className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <button
              {...attributes}
              {...listeners}
              className={cn(
                "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none opacity-0 group-hover:opacity-100",
                disabled && "opacity-50 cursor-not-allowed",
                isDragging && "opacity-100",
                isDeleting && "opacity-0"
              )}
              disabled={disabled || isProcessing || isDeleting}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Track number */}
          <span className="text-sm text-muted-foreground flex-shrink-0 font-mono w-6 text-center">
            {(index + 1).toString().padStart(2, "0")}
          </span>

          {/* Track info */}
          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <span
              className={cn(
                "font-medium truncate transition-colors",
                isCurrentTrack ? "text-primary" : "text-foreground",
                isUploading && "text-foreground/70"
              )}
            >
              {track.title}
            </span>
            {track.artist && (
              <span className="text-sm text-muted-foreground truncate">
                {track.artist}
              </span>
            )}
            {isProcessing && !isUploading && (
              <span className="text-xs text-muted-foreground">
                Processing on Internet Archive...
              </span>
            )}
            {isUploading && (
              <div className="flex items-center gap-2">
                <Progress value={track.uploadProgress} className="h-1 flex-1" />
                <span className="text-xs text-muted-foreground font-mono">
                  {track.uploadProgress}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Processing animation */}
          {isProcessing && !isUploading && (
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

          {/* Uploading spinner */}
          {isUploading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}

          {/* Show playing animation OR duration */}
          {isPlayingTrack && !isProcessing && !isLoading && !isUploading ? (
            <div className="flex gap-1">
              <div className="h-3 w-1 animate-pulse bg-primary rounded-full" />
              <div className="h-3 w-1 animate-pulse bg-primary rounded-full delay-75" />
              <div className="h-3 w-1 animate-pulse bg-primary rounded-full delay-150" />
            </div>
          ) : (
            !isProcessing &&
            !isUploading && (
              <span className="text-sm text-muted-foreground font-mono tabular-nums">
                {formatDuration(track.duration)}
              </span>
            )
          )}

          {/* Loading spinner */}
          {isLoading && !isUploading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}

          {/* Track menu - hide during upload */}
          {!isUploading && (
            <div onClick={(e) => e.stopPropagation()}>
              <TrackMenu
                albumId={albumId}
                trackId={track.id}
                trackTitle={track.title}
                playbackUrl={track.playbackUrl || track.audio_url}
                onDeleteStart={() => onDelete?.(track.id)}
                track={track}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
