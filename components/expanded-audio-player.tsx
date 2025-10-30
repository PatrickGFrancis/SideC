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
  Music,
  ListMusic,
  X,
  GripVertical,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ExpandedAudioPlayerProps {
  isExpanded: boolean;
  onCollapse: () => void;
}

interface Track {
  id: string;
  title: string;
  artist?: string;
  audio_url?: string;
  playbackUrl?: string;
  albumTitle?: string;
  albumId?: string;
  coverUrl?: string;
  processing?: boolean;
}

function QueueTrackItem({
  track,
  onRemove,
  index,
}: {
  track: Track;
  onRemove: () => void;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all group",
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-sm text-muted-foreground font-mono w-6">
        {(index + 1).toString().padStart(2, "0")}
      </span>

      <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0">
        <img
          src={track.coverUrl || "/placeholder.svg"}
          alt={track.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {track.artist || track.albumTitle || "Unknown Artist"}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
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
    fullQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = useAudio();

  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<"player" | "queue">("player");

  // Swipe to close state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Swipe down to close handler
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only handle swipe from the top area (not during scrolling)
    if (activeTab === "queue") return; // Don't interfere with queue scrolling

    const touch = e.touches[0];
    setDragStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null || activeTab === "queue") return;

    const touch = e.touches[0];
    const diff = touch.clientY - dragStartY;

    // Only allow dragging down
    if (diff > 0) {
      setDragOffset(diff);

      // Add resistance for smoother feel
      if (containerRef.current) {
        const resistance = Math.min(diff / 3, 200);
        containerRef.current.style.transform = `translateY(${resistance}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragStartY === null) return;

    // If dragged down more than 100px, close the player
    if (dragOffset > 100) {
      handleCollapse();
    } else {
      // Snap back
      if (containerRef.current) {
        containerRef.current.style.transform = "translateY(0)";
      }
    }

    setDragStartY(null);
    setDragOffset(0);
  };

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fullQueue.findIndex((t) => t.id === active.id);
    const newIndex = fullQueue.findIndex((t) => t.id === over.id);

    reorderQueue(oldIndex, newIndex);
  };

  if (!currentTrack || (!isExpanded && !isClosing)) return null;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`fixed inset-0 bg-gradient-to-b from-background via-background to-card z-50 flex flex-col transition-all duration-300 ease-out ${
        isClosing
          ? "animate-out slide-out-to-bottom"
          : "animate-in slide-in-from-bottom"
      }`}
      style={{
        transition: dragStartY !== null ? "none" : "transform 300ms ease-out",
      }}
    >
      {/* Swipe indicator */}
      {activeTab === "player" && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full md:hidden" />
      )}

      {/* Header with tabs */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCollapse}
            className="hover:bg-secondary/50 hover:text-primary transition-all min-h-[44px] min-w-[44px]"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
          <Link
            href={currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium min-h-[44px] flex items-center"
            onClick={handleCollapse}
          >
            Go to Album
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border/50">
          <button
            onClick={() => setActiveTab("player")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]",
              activeTab === "player"
                ? "text-primary border-b-2 border-primary bg-secondary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
            )}
          >
            <Music className="h-4 w-4" />
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative min-h-[44px]",
              activeTab === "queue"
                ? "text-primary border-b-2 border-primary bg-secondary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
            )}
          >
            <ListMusic className="h-4 w-4" />
            Queue
            {fullQueue.length > 0 && (
              <span className="absolute top-2 right-4 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {fullQueue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "player" ? (
        /* Now Playing View */
        <div className="flex-1 flex flex-col items-center justify-start px-8 pt-8 pb-12 max-w-2xl mx-auto w-full overflow-y-auto">
          {/* Album Cover - Fixed to show full square image */}
          <div className="relative w-full max-w-[280px] sm:max-w-xs mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl group">
            <div className="aspect-square w-full">
              <img
                src={currentTrack.coverUrl || "/placeholder.svg"}
                alt={currentTrack.title}
                className="w-full h-full object-contain bg-secondary/20"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/20 shadow-[0_0_80px_-20px] shadow-primary/30" />
          </div>

          {/* Track Info */}
          <div className="w-full text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {currentTrack.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentTrack.artist ||
                currentTrack.albumTitle ||
                "Unknown Artist"}
            </p>
          </div>

          {/* Progress Bar - Removed decorative bars */}
          <div className="w-full mb-8">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(value) => seek(value[0])}
              className="w-full mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls - Larger touch targets */}
          <div className="flex items-center gap-4 md:gap-8 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={previous}
              disabled={!hasPrevious}
              className="h-14 w-14 hover:bg-secondary/50 hover:text-primary transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
            >
              <SkipBack className="h-7 w-7" />
            </Button>

            <Button
              size="icon"
              onClick={isPlaying ? pause : resume}
              className="h-20 w-20 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="h-10 w-10 fill-current" />
              ) : (
                <Play className="h-10 w-10 fill-current ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={next}
              disabled={!hasNext}
              className="h-14 w-14 hover:bg-secondary/50 hover:text-primary transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
            >
              <SkipForward className="h-7 w-7" />
            </Button>
          </div>

          {/* Volume Control - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4 w-full max-w-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="hover:bg-secondary/50 hover:text-primary transition-all min-h-[44px] min-w-[44px]"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={(value) => setVolume(value[0])}
              className="flex-1"
            />
          </div>
        </div>
      ) : (
        /* Queue View */
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Up Next {fullQueue.length > 0 && `(${fullQueue.length})`}
              </h2>
              {fullQueue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearQueue}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[44px]"
                >
                  Clear All
                </Button>
              )}
            </div>

            {fullQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                  <ListMusic className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground/90">
                  Nothing up next
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start playing an album to see what's next
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fullQueue}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {fullQueue.map((track, index) => (
                      <QueueTrackItem
                        key={track.id}
                        track={track}
                        index={index}
                        onRemove={() => removeFromQueue(track.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
