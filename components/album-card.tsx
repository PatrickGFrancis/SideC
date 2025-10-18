'use client';

import Link from 'next/link';
import { Album } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${album.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/albums/${album.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Album deleted',
          description: `"${album.title}" has been removed.`,
        });
        router.refresh();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete album. Please try again.',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  return (
    <div className="group cursor-pointer relative">
      <Link href={`/album/${album.id}`}>
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted shadow-md transition-all group-hover:shadow-xl group-hover:scale-105">
            <img
              src={album.coverUrl || '/placeholder.svg'}
              alt={album.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
              {album.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {album.artist}
            </p>
          </div>
        </div>
      </Link>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Album'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}