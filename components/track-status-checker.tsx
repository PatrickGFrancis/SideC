'use client';

import { useEffect, useState } from 'react';
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
  const [checkedTracks, setCheckedTracks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const processingTracks = tracks.filter(t => 
      t.processing === true && !checkedTracks.has(t.id)
    );
    
    if (processingTracks.length === 0) return;

    console.log(`Checking status for ${processingTracks.length} processing tracks`);

    const checkInterval = setInterval(async () => {
      const stillProcessing = [];

      for (const track of processingTracks) {
        const playbackUrl = track.playbackUrl || track.audio_url;
        if (!playbackUrl) continue;

        try {
          console.log(`Checking status for track: ${track.id}`);
          
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
            console.log(`Track ${track.id} is now ready!`);
            // Mark this track as checked
            setCheckedTracks(prev => new Set([...prev, track.id]));
            // Refresh the page to show the track as ready
            router.refresh();
          } else {
            console.log(`Track ${track.id} still processing...`);
            stillProcessing.push(track);
          }
        } catch (error) {
          console.error('Error checking track status:', error);
          stillProcessing.push(track);
        }
      }

      // If no tracks are still processing, clear the interval
      if (stillProcessing.length === 0) {
        console.log('All tracks are ready, stopping status checker');
        clearInterval(checkInterval);
      }
    }, 15000); // Check every 15 seconds (more frequent)

    return () => clearInterval(checkInterval);
  }, [tracks, router, checkedTracks]);

  return null;
}