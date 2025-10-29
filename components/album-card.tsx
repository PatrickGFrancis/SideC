'use client';

import Link from 'next/link';
import { Album } from '@/lib/types';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2, Bookmark } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AlbumCardProps {
  album: Album & { isSaved?: boolean; isOwned?: boolean };
}

export function AlbumCard({ album }: AlbumCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
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
        
        startTransition(() => {
          router.refresh();
        });
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

  const handleUnsave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Remove "${album.title}" from your library?`)) {
      return;
    }

    try {
      const response = await fetch('/api/saved-albums', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: album.id }),
      });

      if (response.ok) {
        toast({
          title: 'Removed from library',
          description: `"${album.title}" has been removed.`,
        });
        
        startTransition(() => {
          router.refresh();
        });
      } else {
        throw new Error('Failed to unsave');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove album. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="group cursor-pointer relative">
      <Link href={`/album/${album.id}`} prefetch={true}>
        <div className="space-y-3">
          {/* Album Cover */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/30 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:scale-[1.03]">
            <Image
              src={album.coverUrl || '/placeholder.svg'}
              alt={album.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              priority={false}
              loading="lazy"
            />
            
            {/* Saved badge */}
            {album.isSaved && (
              <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                <Bookmark className="h-3 w-3 fill-current" />
                Saved
              </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-border/50 group-hover:ring-primary/30 transition-all duration-300" />
          </div>

          {/* Album Info */}
          <div className="space-y-1 px-1">
            <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors duration-200">
              {album.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {album.artist}
            </p>
          </div>
        </div>
      </Link>

      {/* Three-dot menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg backdrop-blur-sm bg-card/90 hover:bg-card border border-border/50 hover:border-primary/50 transition-all"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border/50">
            {album.isSaved ? (
              <DropdownMenuItem
                onClick={handleUnsave}
                className="focus:bg-primary/10"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Remove from Library
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete Album'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}