'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QuickCreateAlbumProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickCreateAlbum({ isOpen: controlledOpen, onOpenChange }: QuickCreateAlbumProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleCreate = async () => {
    setCreating(true);
    
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Album',
          artist: 'Unknown Artist',
          releaseDate: new Date().toISOString().split('T')[0],
          description: '',
          coverUrl: '/placeholder.svg',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
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
      setCreating(false);
    }
  };

  // If controlled externally, render without trigger
  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Create a new album?</h2>
            <p className="text-muted-foreground mb-6">This will create a new untitled album that you can customize.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? 'Creating...' : 'Create Album'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button onClick={handleCreate} disabled={creating} className="gap-2">
      <Plus className="h-4 w-4" />
      {creating ? 'Creating...' : 'New Album'}
    </Button>
  );
}