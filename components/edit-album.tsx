'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';

interface EditAlbumProps {
  albumId: string;
  currentTitle: string;
  currentArtist: string;
  currentDescription?: string;
  currentReleaseDate?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditAlbum({
  albumId,
  currentTitle,
  currentArtist,
  currentDescription,
  currentReleaseDate,
  isOpen: controlledOpen,
  onOpenChange,
}: EditAlbumProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [artist, setArtist] = useState(currentArtist);
  const [description, setDescription] = useState(currentDescription || '');
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Format date for input (YYYY-MM-DD) without timezone conversion
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    // Just take the date part, ignore time/timezone
    return dateString.split('T')[0];
  };
  
  const [releaseDate, setReleaseDate] = useState(formatDateForInput(currentReleaseDate));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim() || !artist.trim()) {
      toast({
        title: 'Error',
        description: 'Title and artist are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          description: description.trim(),
          releaseDate: releaseDate || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Album updated',
          description: 'Your changes have been saved.',
        });
        setOpen(false);
        router.refresh();
      } else {
        throw new Error('Failed to update album');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update album. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="hover:bg-secondary/50 transition-all">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
          <DialogDescription>
            Update your album information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Album Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter album title"
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="artist">Artist *</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
              disabled={saving}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={saving}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="releaseDate">Release Date (optional)</Label>
            <Input
              id="releaseDate"
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || !artist.trim()}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}