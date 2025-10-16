'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Track {
  id: string;
  playbackUrl?: string;
  audio_url?: string;
  processing?: boolean;
}

interface TrackStatusCheckerProps {
  tracks: Track[];
}

export function TrackStatusChecker({ tracks }: TrackStatusCheckerProps) {
  const router = useRouter();

  useEffect(() => {
    const processingTracks = tracks.filter(t => t.processing === true);
    
    if (processingTracks.length === 0) return;

    const checkInterval = setInterval(async () => {
      for (const track of processingTracks) {
        const playbackUrl = track.playbackUrl || track.audio_url;
        if (!playbackUrl) continue;

        try {
          const response = await fetch('/api/check-ia-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackId: track.id,
              playbackUrl: playbackUrl,
            }),
          });

          const data = await response.json();
          
          if (data.ready) {
            // Refresh the page to show the track as ready
            router.refresh();
          }
        } catch (error) {
          console.error('Error checking track status:', error);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [tracks, router]);

  return null;
}