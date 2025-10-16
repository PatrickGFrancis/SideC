'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Undo2 } from 'lucide-react';

interface DeletedAlbum {
  id: string;
  title: string;
  artist: string;
  deletedAt: string;
}

export function RecentTrash() {
  const [deletedAlbums, setDeletedAlbums] = useState<DeletedAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchTrash();
  }, []);

  const fetchTrash = async () => {
    try {
      const response = await fetch('/api/albums/trash');
      const data = await response.json();
      setDeletedAlbums(data.deleted || []);
    } catch (error) {
      console.error('Failed to fetch trash:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (albumId: string, albumTitle: string) => {
    try {
      const response = await fetch('/api/albums/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Album restored',
          description: `"${albumTitle}" has been restored.`,
        });
        fetchTrash();
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore album.',
        variant: 'destructive',
      });
    }
  };

  if (loading || deletedAlbums.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Trash ({deletedAlbums.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Recently Deleted</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {deletedAlbums.map((album) => (
          <DropdownMenuItem
            key={album.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => handleRestore(album.id, album.title)}
          >
            <div className="flex-1 min-w-0 mr-2">
              <p className="font-medium truncate">{album.title}</p>
              <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
            </div>
            <Undo2 className="h-4 w-4 flex-shrink-0" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}