'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export function CreateAlbum() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async () => {
    if (!title) {
      toast({
        title: 'Title required',
        description: 'Please enter an album title.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Album created!',
          description: `"${title}" has been created.`,
        });
        setOpen(false);
        setTitle('');
        setArtist('');
        router.push(`/album/${data.album.id}`);
        router.refresh();
      } else {
        throw new Error('Failed to create album');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create album. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Album
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
          <DialogDescription>
            Add a new album to your collection
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="album-title">Album Title</Label>
            <Input
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Album"
            />
          </div>
          <div>
            <Label htmlFor="album-artist">Artist</Label>
            <Input
              id="album-artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist Name"
            />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Album'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}