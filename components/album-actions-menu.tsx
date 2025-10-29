"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Share2, Upload, Edit, Trash2 } from "lucide-react";
import { ShareAlbumButton } from "@/components/share-album-button";
import { UploadTrackToAlbum } from "@/components/upload-track-to-album";
import { EditAlbum } from "@/components/edit-album";
import { DeleteAlbum } from "@/components/delete-album";

interface AlbumActionsMenuProps {
  albumId: string;
  albumTitle: string;
  isPublic: boolean;
  currentTitle?: string;
  currentArtist?: string;
  currentDescription?: string | null;
  currentReleaseDate?: string | null;
}

export function AlbumActionsMenu({
  albumId,
  albumTitle,
  isPublic,
  currentTitle,
  currentArtist,
  currentDescription,
  currentReleaseDate,
}: AlbumActionsMenuProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setShareOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Album
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Track
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Album
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Album
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Controlled dialogs */}
      <ShareAlbumButton
        albumId={albumId}
        isPublic={isPublic}
        isOpen={shareOpen}
        onOpenChange={setShareOpen}
      />
      <UploadTrackToAlbum
        albumId={albumId}
        isOpen={uploadOpen}
        onOpenChange={setUploadOpen}
      />
      <EditAlbum
        albumId={albumId}
        currentTitle={currentTitle}
        currentArtist={currentArtist}
        currentDescription={currentDescription}
        currentReleaseDate={currentReleaseDate}
        isOpen={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteAlbum
        albumId={albumId}
        albumTitle={albumTitle}
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}