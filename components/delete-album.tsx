"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Undo2 } from "lucide-react";

interface DeleteAlbumProps {
  albumId: string;
  albumTitle: string;
}

export function DeleteAlbum({ albumId, albumTitle }: DeleteAlbumProps) {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUndo = async (deletedAlbumId: string) => {
    try {
      const response = await fetch("/api/albums/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: deletedAlbumId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Album restored",
          description: "The album has been restored.",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to undo delete:", error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Album deleted",
          description: `"${albumTitle}" has been deleted.`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUndo(data.albumId)}
              className="gap-1"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </Button>
          ),
        });
        router.push("/");
        router.refresh();
      } else {
        throw new Error("Failed to delete album");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete album. Please try again.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Album
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete "{albumTitle}" and all its tracks. You can undo
            this action from the notification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="destructive"
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
