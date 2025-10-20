"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, ExternalLink, Trash2, Download, ListPlus, PlayCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAudio } from "@/contexts/audio-context";
import { useToast } from "@/hooks/use-toast";

interface TrackMenuProps {
  albumId: string;
  trackId: string;
  trackTitle: string;
  playbackUrl?: string;
  onDeleteStart?: () => void;
  track?: any; // Full track object for queue
}

export function TrackMenu({
  albumId,
  trackId,
  trackTitle,
  playbackUrl,
  onDeleteStart,
  track,
}: TrackMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFromIA, setDeleteFromIA] = useState(false);
  const router = useRouter();
  const { addToQueue, playNext, currentTrack } = useAudio();
  const { toast } = useToast();

  const handleAddToQueue = () => {
    if (!track) return;
    
    // Don't add if it's the current track
    if (currentTrack?.id === track.id) {
      toast({
        title: "Already playing",
        description: "This track is currently playing.",
      });
      return;
    }

    addToQueue(track);
    toast({
      title: "Added to queue",
      description: `"${trackTitle}" has been added to the queue.`,
    });
  };

  const handlePlayNext = () => {
    if (!track) return;

    // Don't add if it's the current track
    if (currentTrack?.id === track.id) {
      toast({
        title: "Already playing",
        description: "This track is currently playing.",
      });
      return;
    }

    playNext(track);
    toast({
      title: "Playing next",
      description: `"${trackTitle}" will play next.`,
    });
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      if (onDeleteStart) {
        onDeleteStart();
      }

      setShowDeleteDialog(false);

      const response = await fetch(`/api/albums/${albumId}/tracks/${trackId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteFromIA }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete track");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleting(false);
      window.location.reload();
    }
  };

  const handleDownload = async () => {
    if (!playbackUrl) return;

    try {
      const response = await fetch(playbackUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trackTitle}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleViewIA = () => {
    if (!playbackUrl) return;

    const s3Match = playbackUrl.match(/s3\.us\.archive\.org\/([^/]+)/);
    const downloadMatch = playbackUrl.match(/\/download\/([^/]+)\//);

    const identifier = s3Match?.[1] || downloadMatch?.[1];

    if (identifier) {
      window.open(`https://archive.org/details/${identifier}`, "_blank");
    } else {
      window.open(playbackUrl, "_blank");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-card/95 backdrop-blur-md border-border/50"
        >
          {track && currentTrack?.id !== track.id && (
            <>
              <DropdownMenuItem
                onClick={handlePlayNext}
                className="cursor-pointer focus:bg-secondary/50"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Play Next
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleAddToQueue}
                className="cursor-pointer focus:bg-secondary/50"
              >
                <ListPlus className="mr-2 h-4 w-4" />
                Add to Queue
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
            </>
          )}
          <DropdownMenuItem
            onClick={handleDownload}
            className="cursor-pointer focus:bg-secondary/50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          {playbackUrl && (
            <DropdownMenuItem
              onClick={handleViewIA}
              className="cursor-pointer focus:bg-secondary/50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Internet Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Track
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{trackTitle}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {playbackUrl && (
            <div className="flex items-center space-x-2 py-4">
              <Checkbox
                id="delete-ia"
                checked={deleteFromIA}
                onCheckedChange={(checked) => setDeleteFromIA(checked === true)}
              />
              <label
                htmlFor="delete-ia"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Also delete from Internet Archive
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}