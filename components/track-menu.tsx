'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrackMenuProps {
  albumId: string;
  trackId: string;
  trackTitle: string;
  playbackUrl?: string;
}

export function TrackMenu({ albumId, trackId, trackTitle, playbackUrl }: TrackMenuProps) {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteFromIA, setDeleteFromIA] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/albums/${albumId}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteFromIA }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Track deleted',
          description: result.iaDeleted 
            ? `"${trackTitle}" has been removed from both your library and Internet Archive.`
            : `"${trackTitle}" has been removed from your library.`,
        });
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete track. Please try again.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  const handleViewOnIA = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playbackUrl) {
      const match = playbackUrl.match(/archive\.org\/download\/([^/]+)/);
      if (match) {
        const identifier = match[1];
        window.open(`https://archive.org/details/${identifier}`, '_blank');
      } else {
        window.open(playbackUrl, '_blank');
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" disabled={deleting} className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewOnIA}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Internet Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDeleteClick}
            disabled={deleting}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Track
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{trackTitle}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-from-ia"
                checked={deleteFromIA}
                onCheckedChange={(checked) => setDeleteFromIA(checked as boolean)}
              />
              <label
                htmlFor="delete-from-ia"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Also delete from Internet Archive
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {deleteFromIA 
                ? "⚠️ This will permanently remove the file from your Internet Archive account. This cannot be undone."
                : "The file will remain in your Internet Archive account and can be re-added later."
              }
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Track'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}