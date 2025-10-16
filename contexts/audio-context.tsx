'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  title: string;
  artist?: string;
  audio_url?: string;
  playbackUrl?: string;
  albumTitle?: string;
  albumId?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  play: (track: Track, playlist?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  updatePlaylist: (newPlaylist: Track[]) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.pause();
    };
  }, []);

  // Handle track ended - auto play next
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (currentIndex < playlist.length - 1) {
        // Play next track
        const nextTrack = playlist[currentIndex + 1];
        setCurrentIndex(currentIndex + 1);
        setCurrentTrack(nextTrack);
        
        const audioUrl = nextTrack.playbackUrl || nextTrack.audio_url;
        if (audioUrl) {
          audio.src = audioUrl;
          audio.load();
          audio.play().catch(() => {});
        }
      } else if (playlist.length > 0) {
        // Loop back to first track
        const firstTrack = playlist[0];
        setCurrentIndex(0);
        setCurrentTrack(firstTrack);
        
        const audioUrl = firstTrack.playbackUrl || firstTrack.audio_url;
        if (audioUrl) {
          audio.src = audioUrl;
          audio.load();
          audio.play().catch(() => {});
        }
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentIndex, playlist]);

  const play = (track: Track, newPlaylist?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const audioUrl = track.playbackUrl || track.audio_url;
    if (!audioUrl) return;

    // If playlist provided, update it
    if (newPlaylist && newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
      const index = newPlaylist.findIndex(t => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }

    // If same track, just resume
    if (currentTrack?.id === track.id && audio.src) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore interruption errors
        });
      }
      setIsPlaying(true);
      return;
    }

    // New track - pause first to prevent interruption
    audio.pause();
    audio.src = audioUrl;
    audio.load();
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setCurrentTrack(track);
          setIsPlaying(true);
        })
        .catch(() => {
          // Ignore interruption errors
        });
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const resume = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Ignore interruption errors
        });
    }
  };

  const next = () => {
    if (currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      play(nextTrack);
    } else if (playlist.length > 0) {
      // Loop back to first track
      const firstTrack = playlist[0];
      setCurrentIndex(0);
      play(firstTrack);
    }
  };

  const previous = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // If more than 3 seconds into the song, restart it
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    // Otherwise go to previous track
    if (currentIndex > 0) {
      const prevTrack = playlist[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      play(prevTrack);
    } else if (playlist.length > 0) {
      // Loop to last track
      const lastTrack = playlist[playlist.length - 1];
      setCurrentIndex(playlist.length - 1);
      play(lastTrack);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const updatePlaylist = (newPlaylist: Track[]) => {
    setPlaylist(newPlaylist);
    // Update current index if current track is in the new playlist
    if (currentTrack) {
      const newIndex = newPlaylist.findIndex(t => t.id === currentTrack.id);
      if (newIndex >= 0) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const hasNext = playlist.length > 0;
  const hasPrevious = playlist.length > 0;

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        play,
        pause,
        resume,
        next,
        previous,
        currentTime,
        duration,
        seek,
        hasNext,
        hasPrevious,
        updatePlaylist,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}