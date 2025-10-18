'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Play, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useAudio } from '@/contexts/audio-context';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  trackNumber: number;
  playbackUrl: string;
  processing: boolean;
  audio_url?: string;
}

interface TrackItemProps {
  track: Track;
  albumId: string;
  albumTitle: string;
  albumArtist: string;
  albumCover: string;
}

export function TrackItem({ track, albumId, albumTitle, albumArtist, albumCover }: TrackItemProps) {
  const { playTrack, currentTrack } = useAudio();
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isPlaying = currentTrack?.id === track.id;

  const handlePlay = () => {
    playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      audioUrl: track.playbackUrl,
      albumTitle: albumTitle,
      albumArtist: albumArtist,
      coverUrl: albumCover,
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Delete "${track.title}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/albums/${albumId}/tracks/${track.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Track deleted',
          description: `"${track.title}" has been removed.`,
        });
        router.refresh();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete track. Please try again.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  const handleViewOnIA = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Extract the identifier from the playback URL
    // Format: https://archive.org/download/{identifier}/{filename}
    const url = track.playbackUrl || track.audio_url;
    if (url) {
      const match = url.match(/archive\.org\/download\/([^/]+)/);
      if (match) {
        const identifier = match[1];
        window.open(`https://archive.org/details/${identifier}`, '_blank');
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div
      className={`group flex items-center gap-4 rounded-lg p-3 transition-colors ${
        isPlaying ? 'bg-primary/10' : 'hover:bg-muted'
      }`}
    >
      <div className="flex-shrink-0 w-8 text-center text-sm text-muted-foreground">
        {track.trackNumber}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlay}
        disabled={track.processing}
        className="flex-shrink-0"
      >
        {track.processing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className={`h-5 w-5 ${isPlaying ? 'fill-current' : ''}`} />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate ${isPlaying ? 'text-primary' : ''}`}>
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        {track.processing && (
          <p className="text-xs text-muted-foreground mt-1">
            Processing on Internet Archive...
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" disabled={deleting}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewOnIA}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Internet Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Track'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}