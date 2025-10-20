"use client";

import { useState } from "react";
import { useAudio } from "@/contexts/audio-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle } from "lucide-react";
import { ExpandedAudioPlayer } from "@/components/expanded-audio-player";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    shuffle,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
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
        className="fixed bottom-0 md:bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-2xl z-40 cursor-pointer transition-all duration-200 hover:bg-card"
        onClick={() => setIsExpanded(true)}
      >
        <div className="relative">
          {/* Mobile progress bar at the very top with gradient */}
          <div className="md:hidden absolute left-0 right-0 -top-0.5">
            <div className="h-1 bg-secondary/30 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Album Cover Thumbnail with glow */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0 ring-1 ring-border/50 shadow-lg">
                <img
                  src={currentTrack.coverUrl || "/placeholder.svg"}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm text-foreground">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack.artist ||
                    currentTrack.albumTitle ||
                    "Unknown Artist"}
                </p>
              </div>

              {/* Desktop Progress with custom styling */}
              <div
                className="hidden md:flex items-center gap-3 flex-1 max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-muted-foreground w-10 text-right font-mono">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 relative group">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={(value) => seek(value[0])}
                    className="flex-1"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="h-full flex items-center">
                      <div className="h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100"
                          style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 font-mono">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controls with shuffle and repeat */}
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Shuffle button (desktop only) */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleShuffle}
                  className={cn(
                    "h-9 w-9 hover:bg-secondary/50 transition-all hidden md:flex",
                    shuffle && "text-primary hover:text-primary"
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={previous}
                  disabled={!hasPrevious}
                  className="h-9 w-9 hover:bg-secondary/50 hover:text-primary transition-all disabled:opacity-30"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={isPlaying ? pause : resume}
                  className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all hover:scale-105 active:scale-95"
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
                  className="h-9 w-9 hover:bg-secondary/50 hover:text-primary transition-all disabled:opacity-30"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {/* Repeat dropdown (desktop only) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-9 w-9 hover:bg-secondary/50 transition-all hidden md:flex",
                        repeatMode !== 'off' && "text-primary hover:text-primary"
                      )}
                    >
                      {repeatMode === 'one' ? (
                        <Repeat1 className="h-4 w-4" />
                      ) : (
                        <Repeat className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border/50">
                    <DropdownMenuItem
                      onClick={() => setRepeatMode('off')}
                      className={cn(
                        "cursor-pointer focus:bg-secondary/50",
                        repeatMode === 'off' && "text-primary"
                      )}
                    >
                      <Repeat className="mr-2 h-4 w-4" />
                      Repeat Off
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRepeatMode('all')}
                      className={cn(
                        "cursor-pointer focus:bg-secondary/50",
                        repeatMode === 'all' && "text-primary"
                      )}
                    >
                      <Repeat className="mr-2 h-4 w-4" />
                      Repeat Album
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRepeatMode('one')}
                      className={cn(
                        "cursor-pointer focus:bg-secondary/50",
                        repeatMode === 'one' && "text-primary"
                      )}
                    >
                      <Repeat1 className="mr-2 h-4 w-4" />
                      Repeat Song
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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