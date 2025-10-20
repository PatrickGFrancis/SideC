'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Track {
  id: string;
  processing?: boolean;
  playbackUrl?: string;
}

interface TrackStatusCheckerProps {
  tracks: Track[];
  albumId: string;
}

export function TrackStatusChecker({ tracks, albumId }: TrackStatusCheckerProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingTracksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const processingTracks = tracks.filter(t => t.processing && t.playbackUrl);

    console.log('TrackStatusChecker: Processing tracks count:', processingTracks.length);

    if (processingTracks.length > 0) {
      processingTracksRef.current = new Set(processingTracks.map(t => t.id));

      const checkStatus = async () => {
        console.log('Checking status for', processingTracks.length, 'tracks');
        
        const checks = processingTracks.map(async (track) => {
          try {
            console.log('Checking track:', track.id, track.playbackUrl);
            const response = await fetch('/api/check-ia-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                trackId: track.id,
                playbackUrl: track.playbackUrl,
              }),
            });
            const data = await response.json();
            console.log('Track', track.id, 'ready:', data.ready);
            return { trackId: track.id, ready: data.ready };
          } catch (error) {
            console.error('Error checking track:', track.id, error);
            return { trackId: track.id, ready: false };
          }
        });

        const results = await Promise.all(checks);
        const anyReady = results.some(r => r.ready);

        console.log('Check results:', results, 'Any ready:', anyReady);

        if (anyReady) {
          console.log('Tracks ready! Reloading page...');
          // Force a hard reload to ensure tracks show as playable
          window.location.reload();
        }
      };

      // Check immediately
      console.log('Starting status checks for album:', albumId);
      checkStatus();

      // Then check every 10 seconds
      intervalRef.current = setInterval(checkStatus, 10000);
    } else {
      console.log('No processing tracks');
      // No processing tracks, stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // If we had processing tracks before but none now, refresh once more
      if (processingTracksRef.current.size > 0) {
        processingTracksRef.current.clear();
        window.location.reload();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tracks, albumId, router]);

  return null;
}