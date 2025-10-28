"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Music, ListMusic, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickCreateAlbum } from "@/components/quick-create-album";
import { CreatePlaylist } from "@/components/create-playlist";
import { UploadTrackToAlbum } from "@/components/upload-track-to-album";

interface FloatingActionButtonProps {
  albumId?: string;
}

export function FloatingActionButton({ albumId }: FloatingActionButtonProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAlbumPage = pathname?.startsWith("/album/");

  const [showAlbumDialog, setShowAlbumDialog] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  if (isHomePage) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 bg-primary hover:bg-primary/90 z-30 hover:scale-110 active:scale-95 transition-all"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-card/95 backdrop-blur-md border-border/50 mb-2"
          >
            <DropdownMenuItem
              onClick={() => setShowAlbumDialog(true)}
              className="cursor-pointer focus:bg-secondary/50 gap-2"
            >
              <Music className="h-4 w-4" />
              New Album
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowPlaylistDialog(true)}
              className="cursor-pointer focus:bg-secondary/50 gap-2"
            >
              <ListMusic className="h-4 w-4" />
              New Playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Render dialogs */}
        {showAlbumDialog && (
          <QuickCreateAlbum 
            isOpen={showAlbumDialog}
            onOpenChange={setShowAlbumDialog}
          />
        )}
        {showPlaylistDialog && (
          <CreatePlaylist
            isOpen={showPlaylistDialog}
            onOpenChange={setShowPlaylistDialog}
          />
        )}
      </>
    );
  }

  if (isAlbumPage && albumId) {
    return (
      <>
        <Button
          size="icon"
          onClick={() => setShowUploadDialog(true)}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 bg-primary hover:bg-primary/90 z-30 hover:scale-110 active:scale-95 transition-all"
        >
          <Upload className="h-6 w-6" />
        </Button>

        {showUploadDialog && (
          <UploadTrackToAlbum 
            albumId={albumId}
            isOpen={showUploadDialog}
            onOpenChange={setShowUploadDialog}
          />
        )}
      </>
    );
  }

  return null;
}