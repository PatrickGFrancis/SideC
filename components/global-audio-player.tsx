"use client";

import { useState } from "react";
import { useAudio } from "@/contexts/audio-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { ExpandedAudioPlayer } from "@/components/expanded-audio-player";

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    pause,
    resume,
    next,
    previous,
    currentTime,
    duration,
    seek,
    hasNext,
    hasPrevious,
  } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      <div
        className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40 cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="relative">
          {/* Mobile progress bar at the very top */}
          <div className="md:hidden absolute left-0 right-0 -top-0.5">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value) => seek(value[0])}
              className="w-full h-1 rounded-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Album Cover Thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={currentTrack.coverUrl || "/placeholder.svg"}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack.artist ||
                    currentTrack.albumTitle ||
                    "Unknown Artist"}
                </p>
              </div>

              {/* Desktop Progress */}
              <div
                className="hidden md:flex items-center gap-2 flex-1 max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={(value) => seek(value[0])}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls */}
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={previous}
                  disabled={!hasPrevious}
                  className="h-9 w-9"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={isPlaying ? pause : resume}
                  className="h-10 w-10"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={next}
                  disabled={!hasNext}
                  className="h-9 w-9"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ExpandedAudioPlayer
        isExpanded={isExpanded}
        onCollapse={() => setIsExpanded(false)}
      />
    </>
  );
}
