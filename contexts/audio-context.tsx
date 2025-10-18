"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

interface Track {
  id: string;
  title: string;
  artist?: string;
  audio_url?: string;
  playbackUrl?: string;
  albumTitle?: string;
  albumId?: string;
  coverUrl?: string;
}

type RepeatMode = "off" | "all" | "one";

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  play: (track: Track, playlist?: Track[]) => Promise<void>;
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
  preload: (track: Track) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedTrackId = useRef<string | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const preloadAudio = new Audio();
    preloadAudio.preload = "auto";
    preloadAudio.crossOrigin = "anonymous";
    preloadAudioRef.current = preloadAudio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleCanPlay = () => {
      console.log("Audio ready to play");
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.pause();
      preloadAudio.pause();
      
      // Clear pending play operations
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  // Shuffle helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Toggle shuffle - simplified to avoid errors
  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const newShuffle = !prev;

      if (newShuffle) {
        // Turning shuffle ON
        if (playlist.length === 0) return newShuffle;

        const currentTrackInPlaylist = playlist[currentIndex];
        if (!currentTrackInPlaylist) return newShuffle;

        const otherTracks = playlist.filter((_, i) => i !== currentIndex);
        const shuffledOthers = shuffleArray(otherTracks);
        const newPlaylist = [currentTrackInPlaylist, ...shuffledOthers];
        setPlaylist(newPlaylist);
        setCurrentIndex(0);
      } else {
        // Turning shuffle OFF
        if (originalPlaylist.length === 0) return newShuffle;

        const currentTrackId = playlist[currentIndex]?.id;
        if (!currentTrackId) {
          setPlaylist([...originalPlaylist]);
          setCurrentIndex(0);
          return newShuffle;
        }

        const originalIndex = originalPlaylist.findIndex(
          (t) => t.id === currentTrackId
        );
        setPlaylist([...originalPlaylist]);
        setCurrentIndex(originalIndex >= 0 ? originalIndex : 0);
      }

      return newShuffle;
    });
  }, [playlist, currentIndex, originalPlaylist]);

  // Auto-preload next track
  useEffect(() => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      if (nextTrack && nextTrack.id !== preloadedTrackId.current) {
        preload(nextTrack);
      }
    }
  }, [currentIndex, playlist]);

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === "one") {
        // Repeat current track
        audio.currentTime = 0;
        audio.play();
      } else if (currentIndex < playlist.length - 1) {
        // Play next track
        next();
      } else if (repeatMode === "all" && playlist.length > 0) {
        // Loop back to first track
        const firstTrack = playlist[0];
        setCurrentIndex(0);
        play(firstTrack);
      } else {
        // Stop playing
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, playlist, repeatMode]);

  const preload = useCallback((track: Track) => {
    const preloadAudio = preloadAudioRef.current;
    if (!preloadAudio) return;

    const audioUrl = track.playbackUrl || track.audio_url;
    if (!audioUrl || preloadedTrackId.current === track.id) return;

    preloadAudio.src = audioUrl;
    preloadAudio.load();
    preloadedTrackId.current = track.id;
    console.log("Preloading track:", track.title);
  }, []);

  const play = useCallback(
    async (track: Track, newPlaylist?: Track[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      const audioUrl = track.playbackUrl || track.audio_url;
      if (!audioUrl) return;

      // Clear any pending play operations
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }

      if (newPlaylist && newPlaylist.length > 0) {
        setOriginalPlaylist(newPlaylist);
        const playlistToUse = shuffle ? shuffleArray(newPlaylist) : newPlaylist;
        setPlaylist(playlistToUse);
        const index = playlistToUse.findIndex((t) => t.id === track.id);
        setCurrentIndex(index >= 0 ? index : 0);
      }

      // If same track, just resume
      if (currentTrack?.id === track.id && audio.src) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error: any) {
          if (error.name !== "AbortError") {
            console.error("Play error:", error);
          }
        }
        return;
      }

      // Pause and reset before loading new track
      audio.pause();
      setIsPlaying(false);
      audio.currentTime = 0;

      const preloadAudio = preloadAudioRef.current;
      if (
        preloadAudio &&
        preloadedTrackId.current === track.id &&
        preloadAudio.src
      ) {
        console.log("Using preloaded audio");
        audio.src = preloadAudio.src;
        preloadedTrackId.current = null;
      } else {
        audio.src = audioUrl;
      }

      // Set track immediately so UI updates
      setCurrentTrack(track);

      // Debounce the actual play operation slightly
      playTimeoutRef.current = setTimeout(async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            const handleCanPlay = () => {
              audio.removeEventListener("canplay", handleCanPlay);
              audio.removeEventListener("error", handleError);
              resolve();
            };

            const handleError = (e: Event) => {
              audio.removeEventListener("canplay", handleCanPlay);
              audio.removeEventListener("error", handleError);
              reject(e);
            };

            audio.addEventListener("canplay", handleCanPlay, { once: true });
            audio.addEventListener("error", handleError, { once: true });
            audio.load();
          });

          await audio.play();
          setIsPlaying(true);
        } catch (error: any) {
          // Ignore abort and pause interruption errors
          if (error.name !== "AbortError" && !error.message?.includes("pause")) {
            console.error("Play error:", error);
          }
          setIsPlaying(false);
        }
      }, 50); // 50ms debounce
    },
    [currentTrack, shuffle]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((error) => console.error("Resume error:", error));
  }, []);

  const next = useCallback(() => {
    // If repeat one is on, just restart the current track
    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }

    if (currentIndex < playlist.length - 1) {
      const nextTrack = playlist[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      play(nextTrack);
    } else if (repeatMode === "all" && playlist.length > 0) {
      const firstTrack = playlist[0];
      setCurrentIndex(0);
      play(firstTrack);
    }
  }, [currentIndex, playlist, play, repeatMode]);

  const previous = useCallback(() => {
    // If repeat one is on, just restart the current track
    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (currentIndex > 0) {
      const prevTrack = playlist[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      play(prevTrack);
    } else if (repeatMode === "all" && playlist.length > 0) {
      const lastTrack = playlist[playlist.length - 1];
      setCurrentIndex(playlist.length - 1);
      play(lastTrack);
    }
  }, [currentIndex, playlist, play, repeatMode]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const updatePlaylist = useCallback(
    (newPlaylist: Track[]) => {
      setOriginalPlaylist(newPlaylist);
      const playlistToUse = shuffle ? shuffleArray(newPlaylist) : newPlaylist;
      setPlaylist(playlistToUse);

      if (currentTrack) {
        const newIndex = playlistToUse.findIndex(
          (t) => t.id === currentTrack.id
        );
        if (newIndex >= 0) {
          setCurrentIndex(newIndex);
        }
      }
    },
    [currentTrack, shuffle]
  );

  const hasNext =
    playlist.length > 0 &&
    (currentIndex < playlist.length - 1 || repeatMode === "all");
  const hasPrevious =
    playlist.length > 0 && (currentIndex > 0 || repeatMode === "all");

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
        preload,
        shuffle,
        toggleShuffle,
        repeatMode,
        setRepeatMode,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}