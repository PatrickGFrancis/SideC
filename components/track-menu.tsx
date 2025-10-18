'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, ExternalLink, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TrackMenuProps {
  albumId: string;
  trackId: string;
  trackTitle: string;
  playbackUrl?: string;
}

export function TrackMenu({ albumId, trackId, trackTitle, playbackUrl }: TrackMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/albums/${albumId}/tracks/${trackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Track deleted',
          description: `"${trackTitle}" has been removed.`,
        });
        router.refresh();
      } else {
        throw new Error('Failed to delete track');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete track. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownload = async () => {
    if (!playbackUrl) {
      toast({
        title: 'Error',
        description: 'Download URL not available',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch the audio file
      const response = await fetch(playbackUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trackTitle}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download started',
        description: `Downloading "${trackTitle}"`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download track. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border/50">
          <DropdownMenuItem
            onClick={handleDownload}
            className="cursor-pointer focus:bg-secondary/50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          {playbackUrl && (
            <DropdownMenuItem
              onClick={() => window.open(playbackUrl, '_blank')}
              className="cursor-pointer focus:bg-secondary/50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Internet Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Track
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{trackTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}