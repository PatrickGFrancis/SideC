"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
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
  processing?: boolean;
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
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  fullQueue: Track[];
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  playNext: (track: Track) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Track[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedTrackId = useRef<string | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousVolumeRef = useRef(1);

  const fullQueue = useMemo(() => {
    const upcomingPlaylistTracks = playlist
      .slice(currentIndex + 1)
      .filter((t) => !t.processing);
    return [...queue, ...upcomingPlaylistTracks];
  }, [queue, playlist, currentIndex]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback(
    (trackId: string) => {
      const inManualQueue = queue.some((t) => t.id === trackId);

      if (inManualQueue) {
        setQueue((prev) => prev.filter((t) => t.id !== trackId));
      } else {
        setPlaylist((prev) => prev.filter((t) => t.id !== trackId));
        setOriginalPlaylist((prev) => prev.filter((t) => t.id !== trackId));
      }
    },
    [queue]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const reorderQueue = useCallback(
    (startIndex: number, endIndex: number) => {
      const upcomingPlaylistTracks = playlist
        .slice(currentIndex + 1)
        .filter((t) => !t.processing);
      const totalQueue = [...queue, ...upcomingPlaylistTracks];

      const result = Array.from(totalQueue);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);

      const newQueue = result.slice(0, queue.length);
      const newUpcoming = result.slice(queue.length);

      setQueue(newQueue);

      if (newUpcoming.length > 0) {
        const beforeCurrent = playlist.slice(0, currentIndex + 1);
        const afterReorder = [...beforeCurrent, ...newUpcoming];
        const remainingTracks = playlist.slice(
          currentIndex + 1 + upcomingPlaylistTracks.length
        );
        const newPlaylist = [...afterReorder, ...remainingTracks];
        setPlaylist(newPlaylist);
        setOriginalPlaylist(newPlaylist);
      }
    },
    [queue, playlist, currentIndex]
  );

  const playNext = useCallback((track: Track) => {
    setQueue((prev) => [track, ...prev]);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      setVolumeState(newVolume);
      if (newVolume > 0) {
        setIsMuted(false);
        previousVolumeRef.current = newVolume;
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = previousVolumeRef.current;
      setVolumeState(previousVolumeRef.current);
      setIsMuted(false);
    } else {
      previousVolumeRef.current = volume;
      audio.volume = 0;
      setVolumeState(0);
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const newShuffle = !prev;

      if (newShuffle) {
        if (playlist.length === 0) return newShuffle;

        const currentTrackInPlaylist = playlist[currentIndex];
        if (!currentTrackInPlaylist) return newShuffle;

        const otherTracks = playlist.filter((_, i) => i !== currentIndex);
        const shuffledOthers = shuffleArray(otherTracks);
        const newPlaylist = [currentTrackInPlaylist, ...shuffledOthers];
        setPlaylist(newPlaylist);
        setCurrentIndex(0);
      } else {
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

  // Update media session metadata
  const updateMediaSession = useCallback((track: Track) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || track.albumTitle || "Unknown Artist",
        album: track.albumTitle || "SideC",
        artwork: [
          { src: track.coverUrl || "/icon-512.png", sizes: "96x96", type: "image/png" },
          { src: track.coverUrl || "/icon-512.png", sizes: "128x128", type: "image/png" },
          { src: track.coverUrl || "/icon-512.png", sizes: "192x192", type: "image/png" },
          { src: track.coverUrl || "/icon-512.png", sizes: "256x256", type: "image/png" },
          { src: track.coverUrl || "/icon-512.png", sizes: "384x384", type: "image/png" },
          { src: track.coverUrl || "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
      navigator.mediaSession.playbackState = "playing";
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);

        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
      })
      .catch((error) => console.error("Resume error:", error));
  }, []);

  const next = useCallback(() => {
    if (repeatMode === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }

    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      play(nextTrack);
      return;
    }

    let nextIndex = currentIndex + 1;
    while (nextIndex < playlist.length) {
      const nextTrack = playlist[nextIndex];
      if (!nextTrack.processing) {
        setCurrentIndex(nextIndex);
        play(nextTrack);
        return;
      }
      nextIndex++;
    }

    if (repeatMode === "all" && playlist.length > 0) {
      const firstPlayableTrack = playlist.find((t) => !t.processing);
      if (firstPlayableTrack) {
        const index = playlist.findIndex((t) => t.id === firstPlayableTrack.id);
        setCurrentIndex(index);
        play(firstPlayableTrack);
        return;
      }
    }

    setIsPlaying(false);
  }, [currentIndex, playlist, repeatMode, queue]);

  const previous = useCallback(() => {
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

    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0) {
      const prevTrack = playlist[prevIndex];
      if (!prevTrack.processing) {
        setCurrentIndex(prevIndex);
        play(prevTrack);
        return;
      }
      prevIndex--;
    }

    if (repeatMode === "all" && playlist.length > 0) {
      for (let i = playlist.length - 1; i >= 0; i--) {
        if (!playlist[i].processing) {
          setCurrentIndex(i);
          play(playlist[i]);
          return;
        }
      }
    }
  }, [currentIndex, playlist, repeatMode]);

  // Set up media session handlers once
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        resume();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        pause();
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        previous();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        next();
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        const audio = audioRef.current;
        if (audio && details.seekTime !== null && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
        }
      });
    }
  }, [pause, resume, previous, next]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    audioRef.current = audio;

    const preloadAudio = new Audio();
    preloadAudio.preload = "auto";
    preloadAudio.crossOrigin = "anonymous";
    preloadAudioRef.current = preloadAudio;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);

      if ("mediaSession" in navigator && audio.duration) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    };

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
      audio.src = ""; // Clear source
      preloadAudio.pause();
      preloadAudio.src = ""; // Clear source

      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, [volume]);

  useEffect(() => {
    let nextTrack: Track | null = null;

    if (queue.length > 0) {
      nextTrack = queue[0];
    } else if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      nextTrack = playlist[currentIndex + 1];
    }

    if (nextTrack && nextTrack.id !== preloadedTrackId.current) {
      preload(nextTrack);
    }
  }, [currentIndex, playlist, queue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else if (queue.length > 0) {
        const nextTrack = queue[0];
        setQueue((prev) => prev.slice(1));
        play(nextTrack);
      } else if (currentIndex < playlist.length - 1) {
        next();
      } else if (repeatMode === "all" && playlist.length > 0) {
        const firstTrack = playlist[0];
        setCurrentIndex(0);
        play(firstTrack);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, playlist, repeatMode, queue, next]);

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

      let audioUrl = track.playbackUrl || track.audio_url;

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && track.audio_url) {
        audioUrl = track.audio_url;
      }

      if (!audioUrl) {
        console.error("No audio URL for track:", track.title);
        return;
      }

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

      if (currentTrack?.id === track.id && audio.src) {
        try {
          await audio.play();
          setIsPlaying(true);
          updateMediaSession(track);
        } catch (error: any) {
          if (error.name !== "AbortError") {
            console.error("Play error (resume):", error);
          }
        }
        return;
      }

      // CRITICAL: Stop and clear previous audio completely
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);

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

      setCurrentTrack(track);

      try {
        audio.load();
        await audio.play();
        setIsPlaying(true);
        updateMediaSession(track);
      } catch (error: any) {
        console.error("Immediate play failed, trying with delay:", error);

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
            updateMediaSession(track);
          } catch (error: any) {
            if (
              error.name !== "AbortError" &&
              !error.message?.includes("pause")
            ) {
              console.error("Play error (delayed):", error);
            }
            setIsPlaying(false);
          }
        }, 50);
      }
    },
    [currentTrack, shuffle, updateMediaSession]
  );

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
    repeatMode === "one" ||
    repeatMode === "all" ||
    queue.length > 0 ||
    (playlist.length > 0 && currentIndex < playlist.length - 1);

  const hasPrevious =
    repeatMode === "one" ||
    repeatMode === "all" ||
    (playlist.length > 0 && currentIndex > 0);

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
        volume,
        setVolume,
        isMuted,
        toggleMute,
        fullQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        playNext,
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