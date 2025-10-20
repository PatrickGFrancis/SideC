'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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

interface OptimisticTracksContextType {
  optimisticTracks: Track[];
  addOptimisticTrack: (track: Track) => void;
  updateOptimisticTrack: (trackId: string, updates: Partial<Track>) => void;
  removeOptimisticTrack: (trackId: string) => void;
}

const OptimisticTracksContext = createContext<OptimisticTracksContextType | null>(null);

export function OptimisticTracksProvider({ children }: { children: ReactNode }) {
  const [optimisticTracks, setOptimisticTracks] = useState<Track[]>([]);

  const addOptimisticTrack = (track: Track) => {
    setOptimisticTracks(prev => [...prev, track]);
  };

  const updateOptimisticTrack = (trackId: string, updates: Partial<Track>) => {
    setOptimisticTracks(prev => 
      prev.map(t => t.id === trackId ? { ...t, ...updates } : t)
    );
  };

  const removeOptimisticTrack = (trackId: string) => {
    setOptimisticTracks(prev => prev.filter(t => t.id !== trackId));
  };

  return (
    <OptimisticTracksContext.Provider
      value={{
        optimisticTracks,
        addOptimisticTrack,
        updateOptimisticTrack,
        removeOptimisticTrack,
      }}
    >
      {children}
    </OptimisticTracksContext.Provider>
  );
}

export function useOptimisticTracks() {
  const context = useContext(OptimisticTracksContext);
  if (!context) {
    throw new Error('useOptimisticTracks must be used within OptimisticTracksProvider');
  }
  return context;
}