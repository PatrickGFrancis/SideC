"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Track {
  id: string;
  playbackUrl?: string;
  duration?: number | string;
  processing?: boolean;
}

interface TrackDurationFetcherProps {
  tracks: Track[];
  albumId: string;
}

export function TrackDurationFetcher({
  tracks,
  albumId,
}: TrackDurationFetcherProps) {
  const processedTracks = useRef<Set<string>>(new Set());
  const fetchingTracks = useRef<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // Find tracks that need duration (not processing, have playback URL, duration missing or 0)
    const tracksNeedingDuration = tracks.filter((t) => {
      if (t.processing) return false;
      if (!t.playbackUrl) return false;
      if (processedTracks.current.has(t.id)) return false;
      if (fetchingTracks.current.has(t.id)) return false; // Don't fetch if already fetching

      const needsDuration =
        !t.duration ||
        t.duration === 0 ||
        t.duration === "0" ||
        t.duration === "0:00" ||
        t.duration === "--:--";

      return needsDuration;
    });

    if (tracksNeedingDuration.length === 0) return;

    console.log(
      `🔍 Fetching durations for ${tracksNeedingDuration.length} tracks`
    );

    let updatedCount = 0;

    tracksNeedingDuration.forEach((track) => {
      fetchingTracks.current.add(track.id);

      const audio = new Audio();
      audio.preload = "metadata";

      const timeoutId = setTimeout(() => {
        console.warn(`⏱️ Timeout fetching duration for ${track.id}`);
        fetchingTracks.current.delete(track.id);
      }, 10000); // 10 second timeout

      audio.addEventListener("loadedmetadata", async () => {
        clearTimeout(timeoutId);
        const duration = Math.floor(audio.duration);

        if (duration && !isNaN(duration) && duration > 0) {
          try {
            const response = await fetch(
              `/api/albums/${albumId}/tracks/${track.id}/duration`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ duration }),
              }
            );

            if (response.ok) {
              console.log(`✅ Duration updated: ${track.id} = ${duration}s`);
              processedTracks.current.add(track.id);
              fetchingTracks.current.delete(track.id);
              updatedCount++;

              // Refresh page after updating duration
              setTimeout(() => {
                router.refresh();
              }, 500);
            }
          } catch (error) {
            console.error("Failed to update duration:", error);
            fetchingTracks.current.delete(track.id);
          }
        }
      });

      audio.addEventListener("error", (e) => {
        clearTimeout(timeoutId);
        console.error(`❌ Failed to load metadata for ${track.id}`);
        fetchingTracks.current.delete(track.id);
      });

      audio.src = track.playbackUrl!;
    });
  }, [tracks, albumId, router]);

  return null;
}
