'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTrackItem } from '@/components/sortable-track-item';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/contexts/audio-context';

interface Track {
  id: string;
  title: string;
  artist?: string;
  order: number;
  playbackUrl?: string;
  audio_url?: string;
  albumId?: string;
}

interface SortableTrackListProps {
  tracks: Track[];
  albumId: string;
  albumTitle: string;
  coverUrl?: string;
  onPlay: (track: Track, tracks: Track[]) => void;
}

export function SortableTrackList({
  tracks: initialTracks,
  albumId,
  albumTitle,
  coverUrl,
  onPlay,
}: SortableTrackListProps) {
  const [tracks, setTracks] = useState(initialTracks);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { updatePlaylist, currentTrack } = useAudio();

  // Only render drag-and-drop on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tracks.findIndex((t) => t.id === active.id);
    const newIndex = tracks.findIndex((t) => t.id === over.id);

    const newTracks = arrayMove(tracks, oldIndex, newIndex);
    
    setTracks(newTracks);

    if (currentTrack?.albumId === albumId) {
      updatePlaylist(
        newTracks.map((track) => ({
          ...track,
          albumTitle,
          albumId,
          coverUrl,
        }))
      );
    }

    setIsSaving(true);
    try {
      const trackOrders = newTracks.map((track, index) => ({
        id: track.id,
        order: index,
      }));

      const response = await fetch(`/api/albums/${albumId}/tracks/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackOrders }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving track order:', error);
      setTracks(tracks);
      
      if (currentTrack?.albumId === albumId) {
        updatePlaylist(
          tracks.map((track) => ({
            ...track,
            albumTitle,
            albumId,
            coverUrl,
          }))
        );
      }
      
      toast({
        title: 'Error',
        description: 'Failed to save track order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render without drag-and-drop until mounted
  if (!isMounted) {
    return (
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <SortableTrackItem
            key={track.id}
            track={track}
            index={index}
            albumId={albumId}
            albumTitle={albumTitle}
            coverUrl={coverUrl}
            onPlay={() => onPlay(track, tracks)}
            disabled={true}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tracks} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <SortableTrackItem
              key={track.id}
              track={track}
              index={index}
              albumId={albumId}
              albumTitle={albumTitle}
              coverUrl={coverUrl}
              onPlay={() => onPlay(track, tracks)}
              disabled={isSaving}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}