'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function QuickCreateAlbum() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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

  return (
    <Button onClick={handleCreate} disabled={creating} className="gap-2">
      <Plus className="h-4 w-4" />
      {creating ? 'Creating...' : 'New Album'}
    </Button>
  );
}