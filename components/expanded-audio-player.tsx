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
  } = useAudio();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
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
    }, 300); // Match animation duration
  };

  if (!currentTrack || (!isExpanded && !isClosing)) return null;

  return (
    <div
      className={`fixed inset-0 bg-background z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isClosing
          ? "animate-out slide-out-to-bottom"
          : "animate-in slide-in-from-bottom"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleCollapse}>
          <ChevronDown className="h-6 w-6" />
        </Button>
        <Link
          href={currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"}
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={handleCollapse}
        >
          Go to Album
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 max-w-2xl mx-auto w-full">
        {/* Album Art */}
        <div className="w-full max-w-md aspect-square mb-8 rounded-lg overflow-hidden shadow-2xl">
          <img
            src={currentTrack.coverUrl || "/placeholder.svg"}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </div>

        {/* Track Info */}
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentTrack.title}</h1>
          <p className="text-lg text-muted-foreground">
            {currentTrack.artist || currentTrack.albumTitle || "Unknown Artist"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-8">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={(value) => seek(value[0])}
            className="w-full mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            disabled={!hasPrevious}
            className="h-12 w-12"
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            onClick={isPlaying ? pause : resume}
            className="h-16 w-16"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 fill-current" />
            ) : (
              <Play className="h-8 w-8 fill-current" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            disabled={!hasNext}
            className="h-12 w-12"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-4 w-full max-w-xs">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={(value) => {
              setVolume(value[0]);
              setIsMuted(value[0] === 0);
            }}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
