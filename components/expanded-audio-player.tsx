"use client";

import { useAudio } from "@/contexts/audio-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface ExpandedAudioPlayerProps {
  isExpanded: boolean;
  onCollapse: () => void;
}

export function ExpandedAudioPlayer({
  isExpanded,
  onCollapse,
}: ExpandedAudioPlayerProps) {
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
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useAudio();

  const [isClosing, setIsClosing] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleCollapse = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onCollapse();
    }, 300);
  };

  if (!currentTrack || (!isExpanded && !isClosing)) return null;

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-b from-background via-background to-card z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isClosing
          ? "animate-out slide-out-to-bottom"
          : "animate-in slide-in-from-bottom"
      }`}
    >
      {/* Header with glass effect */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCollapse}
          className="hover:bg-secondary/50 hover:text-primary transition-all"
        >
          <ChevronDown className="h-6 w-6" />
        </Button>
        <Link
          href={currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"}
          className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
          onClick={handleCollapse}
        >
          Go to Album
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 max-w-2xl mx-auto w-full">
        {/* Album Art with enhanced shadow and glow */}
        <div className="relative w-full max-w-md aspect-square mb-8 rounded-2xl overflow-hidden shadow-2xl group">
          <img
            src={currentTrack.coverUrl || "/placeholder.svg"}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
          
          {/* Glowing ring */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/20 shadow-[0_0_80px_-20px] shadow-primary/30" />
        </div>

        {/* Track Info with gradient text */}
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {currentTrack.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {currentTrack.artist || currentTrack.albumTitle || "Unknown Artist"}
          </p>
        </div>

        {/* Progress Bar with gradient */}
        <div className="w-full mb-8">
          <div className="relative mb-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value) => seek(value[0])}
              className="w-full"
            />
            {/* Custom gradient progress indicator */}
            <div className="absolute inset-0 pointer-events-none flex items-center">
              <div className="h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-100"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls with enhanced styling */}
        <div className="flex items-center gap-4 md:gap-8 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            disabled={!hasPrevious}
            className="h-12 w-12 hover:bg-secondary/50 hover:text-primary transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            onClick={isPlaying ? pause : resume}
            className="h-16 w-16 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 fill-current" />
            ) : (
              <Play className="h-8 w-8 fill-current ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            disabled={!hasNext}
            className="h-12 w-12 hover:bg-secondary/50 hover:text-primary transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {/* Volume Control with gradient */}
        <div className="flex items-center gap-4 w-full max-w-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="hover:bg-secondary/50 hover:text-primary transition-all"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <div className="flex-1 relative">
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={(value) => setVolume(value[0])}
              className="flex-1"
            />
            {/* Volume gradient indicator */}
            <div className="absolute inset-0 pointer-events-none flex items-center">
              <div className="h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-muted-foreground to-primary transition-all duration-100"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}