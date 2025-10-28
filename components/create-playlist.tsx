"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface CreatePlaylistProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreatePlaylist({ isOpen: controlledOpen, onOpenChange }: CreatePlaylistProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a playlist title.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create playlist");
      }

      toast({
        title: "Playlist created!",
        description: `"${title}" has been created.`,
      });

      setTitle("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Failed to create playlist",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // If controlled externally, render without trigger
  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle>Create Playlist</DialogTitle>
            <DialogDescription>
              Create a custom playlist to organize your favorite tracks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Playlist Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Playlist"
                disabled={creating}
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Songs that make me happy..."
                disabled={creating}
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="w-full hover:bg-primary/90 transition-all"
            >
              {creating ? "Creating..." : "Create Playlist"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all">
          <Plus className="h-4 w-4" />
          New Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
          <DialogDescription>
            Create a custom playlist to organize your favorite tracks
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Playlist Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Playlist"
              disabled={creating}
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Songs that make me happy..."
              disabled={creating}
              rows={3}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="w-full hover:bg-primary/90 transition-all"
          >
            {creating ? "Creating..." : "Create Playlist"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}