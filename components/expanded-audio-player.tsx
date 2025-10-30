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
        "flex items-center gap-3 p-3 rounded-lg bg-secondary/30 transition-all group",
        isDragging && "opacity-50 shadow-xl z-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground transition-colors touch-none min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <GripVertical className="h-5 w-5" />
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
        className="h-10 w-10 flex-shrink-0 hover:bg-destructive/20 hover:text-destructive min-h-[44px] min-w-[44px]"
      >
        <X className="h-5 w-5" />
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

  // Prevent body scroll when expanded player is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isExpanded]);

  // Swipe down to close handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTab === "queue") return;
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null || activeTab === "queue") return;

    const touch = e.touches[0];
    const diff = touch.clientY - dragStartY;

    if (diff > 0) {
      setDragOffset(diff);

      if (containerRef.current) {
        const resistance = Math.min(diff / 3, 200);
        containerRef.current.style.transform = `translateY(${resistance}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragStartY === null) return;

    if (dragOffset > 100) {
      handleCollapse();
    } else {
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
    }, 200);
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
      className={cn(
        "fixed inset-0 bg-background z-50 flex flex-col",
        isClosing ? "animate-fade-out" : "animate-fade-in"
      )}
      style={{
        transition: dragStartY !== null ? "none" : undefined,
      }}
    >
      {/* Swipe indicator */}
      {activeTab === "player" && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-muted-foreground/30 rounded-full md:hidden z-10" />
      )}

      {/* Header with tabs */}
      <div className="border-b border-border/50 bg-card pt-safe flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCollapse}
            className="hover:bg-secondary/50 hover:text-primary transition-colors min-h-[44px] min-w-[44px]"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
          <Link
            href={currentTrack.albumId ? `/album/${currentTrack.albumId}` : "#"}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium min-h-[44px] flex items-center px-3"
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
                : "text-muted-foreground"
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
                : "text-muted-foreground"
            )}
          >
            <ListMusic className="h-4 w-4" />
            Queue
            {fullQueue.length > 0 && (
              <span className="absolute top-2 right-4 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {fullQueue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "player" ? (
        /* Now Playing View */
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 overflow-y-auto pb-safe">
          <div className="w-full max-w-md mx-auto flex flex-col items-center flex-1 justify-center space-y-6">
            {/* Album Cover */}
            <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden shadow-2xl">
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
              <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/20" />
            </div>

            {/* Track Info */}
            <div className="w-full text-center px-2">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 line-clamp-2">
                {currentTrack.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground line-clamp-1">
                {currentTrack.artist ||
                  currentTrack.albumTitle ||
                  "Unknown Artist"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full px-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={(value) => seek(value[0])}
                className="w-full mb-2"
              />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={previous}
                disabled={!hasPrevious}
                className="h-14 w-14 hover:bg-secondary/50 hover:text-primary disabled:opacity-30 min-h-[56px] min-w-[56px]"
              >
                <SkipBack className="h-7 w-7" />
              </Button>

              <Button
                size="icon"
                onClick={isPlaying ? pause : resume}
                className="h-20 w-20 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 min-h-[80px] min-w-[80px]"
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
                className="h-14 w-14 hover:bg-secondary/50 hover:text-primary disabled:opacity-30 min-h-[56px] min-w-[56px]"
              >
                <SkipForward className="h-7 w-7" />
              </Button>
            </div>

            {/* Volume Control - Desktop only */}
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
        </div>
      ) : (
        /* Queue View */
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                Up Next {fullQueue.length > 0 && `(${fullQueue.length})`}
              </h2>
              {fullQueue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearQueue}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[44px] px-4"
                >
                  Clear All
                </Button>
              )}
            </div>

            {fullQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                  <ListMusic className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base sm:text-lg font-medium text-foreground/90">
                  Nothing up next
                </p>
                <p className="text-sm text-muted-foreground mt-1 px-4">
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
