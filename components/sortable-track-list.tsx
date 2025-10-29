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
import { useOptimisticTracks } from '@/contexts/optimistic-tracks-context';

interface Track {
  id: string;
  title: string;
  artist?: string;
  order: number;
  playbackUrl?: string;
  audio_url?: string;
  albumId?: string;
  duration?: number | string;
  processing?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface SortableTrackListProps {
  tracks: Track[];
  albumId: string;
  albumTitle: string;
  coverUrl?: string;
  onPlay: (track: Track, tracks: Track[]) => void;
  isGuest?: boolean;
}

export function SortableTrackList({
  tracks: initialTracks,
  albumId,
  albumTitle,
  coverUrl,
  onPlay,
  isGuest = false,
}: SortableTrackListProps) {
  const [tracks, setTracks] = useState(initialTracks);
  const { optimisticTracks } = useOptimisticTracks();
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { updatePlaylist, currentTrack } = useAudio();

  // Merge server tracks with optimistic tracks for this album (only for owners)
  const albumOptimisticTracks = isGuest ? [] : optimisticTracks.filter(t => t.albumId === albumId);
  const allTracks = [...tracks, ...albumOptimisticTracks];

  // Update tracks when initialTracks changes
  useEffect(() => {
    setTracks(initialTracks);
  }, [initialTracks]);

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

  const handleTrackDelete = (trackId: string) => {
    setDeletingTrackId(trackId);
    
    setTimeout(() => {
      setTracks(prev => prev.filter(t => t.id !== trackId));
      setDeletingTrackId(null);
      
      if (currentTrack?.albumId === albumId) {
        const newTracks = tracks.filter(t => t.id !== trackId);
        updatePlaylist(
          newTracks.map((track) => ({
            ...track,
            albumTitle,
            albumId,
            coverUrl,
          }))
        );
      }
      
      setTimeout(() => {
        router.refresh();
      }, 100);
    }, 300);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // Guests cannot reorder
    if (isGuest) return;

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = allTracks.findIndex((t) => t.id === active.id);
    const newIndex = allTracks.findIndex((t) => t.id === over.id);

    const newTracks = arrayMove(allTracks, oldIndex, newIndex);
    
    setTracks(newTracks.filter(t => !t.isUploading));

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
      const trackOrders = newTracks
        .filter(t => !t.isUploading)
        .map((track, index) => ({
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

  if (!isMounted) {
    return (
      <div className="space-y-2">
        {allTracks.map((track, index) => (
          <SortableTrackItem
            key={track.id}
            track={track}
            index={index}
            albumId={albumId}
            albumTitle={albumTitle}
            coverUrl={coverUrl}
            onPlay={() => onPlay(track, allTracks)}
            disabled={true}
            isDeleting={false}
            onDelete={handleTrackDelete}
            isGuest={isGuest}
          />
        ))}
      </div>
    );
  }

  // For guests, render simple list without drag-and-drop
  if (isGuest) {
    return (
      <div className="space-y-2">
        {allTracks.map((track, index) => (
          <SortableTrackItem
            key={track.id}
            track={track}
            index={index}
            albumId={albumId}
            albumTitle={albumTitle}
            coverUrl={coverUrl}
            onPlay={() => onPlay(track, allTracks)}
            disabled={false}
            isDeleting={false}
            onDelete={handleTrackDelete}
            isGuest={true}
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
      <SortableContext items={allTracks} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {allTracks.map((track, index) => (
            <SortableTrackItem
              key={track.id}
              track={track}
              index={index}
              albumId={albumId}
              albumTitle={albumTitle}
              coverUrl={coverUrl}
              onPlay={() => onPlay(track, allTracks)}
              disabled={isSaving || track.isUploading}
              isDeleting={deletingTrackId === track.id}
              onDelete={handleTrackDelete}
              isGuest={false}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}