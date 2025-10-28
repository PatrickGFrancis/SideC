"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useOptimisticTracks } from "@/contexts/optimistic-tracks-context";

interface UploadTrackToAlbumProps {
  albumId: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UploadTrackToAlbum({
  albumId,
  isOpen: controlledOpen,
  onOpenChange,
}: UploadTrackToAlbumProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // ... rest of the component stays the same
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<
    "preparing" | "uploading" | "processing" | "saving" | "complete"
  >("preparing");
  const [isIAConnected, setIsIAConnected] = useState(false);
  const [iaCredentials, setIaCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { addOptimisticTrack, updateOptimisticTrack, removeOptimisticTrack } =
    useOptimisticTracks();

  useEffect(() => {
    // Check if user has IA credentials
    const checkCredentials = async () => {
      try {
        const response = await fetch("/api/ia-credentials");
        const data = await response.json();
        setIsIAConnected(data.hasCredentials);
        if (data.hasCredentials) {
          setIaCredentials({
            username: data.username,
            password: data.password,
          });
        }
      } catch (error) {
        setIsIAConnected(false);
      }
    };

    checkCredentials();
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const getUploadStatusText = () => {
    switch (uploadStage) {
      case "preparing":
        return "Preparing upload...";
      case "uploading":
        return `Uploading to Internet Archive... ${uploadProgress}%`;
      case "processing":
        return "Processing audio file...";
      case "saving":
        return "Saving track to album...";
      case "complete":
        return "Upload complete!";
      default:
        return "";
    }
  };

  const handleUpload = async () => {
    if (!file || !isIAConnected || !iaCredentials) return;

    // Close dialog immediately
    setOpen(false);

    setUploading(true);
    setUploadProgress(0);
    setUploadStage("preparing");

    // Generate temporary ID for optimistic track
    const optimisticTrackId = `temp-${Date.now()}`;

    // Add optimistic track immediately with setTimeout to avoid render conflict
    setTimeout(() => {
      addOptimisticTrack({
        id: optimisticTrackId,
        title: title || file.name,
        artist: artist || "Unknown Artist",
        order: 999,
        albumId: albumId,
        isUploading: true,
        uploadProgress: 0,
      });
    }, 0);

    const updateProgress = (progress: number) => {
      setUploadProgress(progress);
      setTimeout(() => {
        updateOptimisticTrack(optimisticTrackId, { uploadProgress: progress });
      }, 0);
    };

    const iaFormData = new FormData();
    iaFormData.append("file", file);
    iaFormData.append("iaUsername", iaCredentials.username);
    iaFormData.append("iaPassword", iaCredentials.password);
    iaFormData.append("title", title || file.name);
    iaFormData.append("artist", artist || "Unknown Artist");

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadStage("uploading");

      // Simulate smooth progress
      const estimatedSeconds = Math.max(10, (file.size / 1024 / 1024) * 2);
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) return prev;
          const newProgress = Math.min(prev + 2, 95);
          updateProgress(newProgress);
          return newProgress;
        });
      }, (estimatedSeconds / 50) * 1000);

      const response = await fetch("/api/upload-to-ia", {
        method: "POST",
        body: iaFormData,
      });

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      const iaData = await response.json();

      if (!iaData.success) {
        throw new Error(iaData.error || "Upload failed");
      }

      updateProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadStage("processing");

      // Fetch duration from local file
      let fetchedDuration = 0;
      try {
        const audioForDuration = new Audio();
        audioForDuration.preload = "metadata";

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);

          audioForDuration.addEventListener("loadedmetadata", () => {
            clearTimeout(timeout);
            fetchedDuration = Math.floor(audioForDuration.duration);
            resolve(null);
          });

          audioForDuration.addEventListener("error", () => {
            clearTimeout(timeout);
            reject(new Error("Failed to load audio"));
          });

          audioForDuration.src = URL.createObjectURL(file);
        });
      } catch (error) {
        console.warn("Could not fetch duration from file:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadStage("saving");

      const trackData = {
        title: title || file.name,
        artist: artist || "Unknown Artist",
        playbackUrl: iaData.playbackUrl,
        iaDetailsUrl: iaData.iaDetailsUrl,
        fileName: file.name,
        duration: fetchedDuration,
      };

      const dbResponse = await fetch(`/api/albums/${albumId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackData),
      });

      const result = await dbResponse.json();

      if (result.success) {
        setUploadStage("complete");

        // Remove optimistic track with setTimeout
        setTimeout(() => {
          removeOptimisticTrack(optimisticTrackId);
        }, 0);

        setFile(null);
        setTitle("");
        setArtist("");
        setUploadProgress(0);
        setUploadStage("preparing");
        setOpen(false);

        // Refresh to show real track
        setTimeout(() => {
          router.refresh();
        }, 100);
      } else {
        throw new Error("Failed to save track");
      }
    } catch (error: any) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Remove optimistic track on error with setTimeout
      setTimeout(() => {
        removeOptimisticTrack(optimisticTrackId);
      }, 0);

      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
      setUploadStage("preparing");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all">
          <Upload className="h-4 w-4" />
          Upload Track
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Upload Track</DialogTitle>
          <DialogDescription>Add a new track to this album</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isIAConnected && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">
              ⚠️ Please add your Internet Archive credentials in Settings first
            </div>
          )}

          <div>
            <Label htmlFor="audio-file">Audio File</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg"
              onChange={handleFileChange}
              disabled={uploading || !isIAConnected}
              className="cursor-pointer file:cursor-pointer"
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Track Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="artist">Artist (optional)</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Leave empty to use album artist"
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {(uploadStage === "processing" || uploadStage === "saving") && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                <span className="text-foreground/90">
                  {getUploadStatusText()}
                </span>
              </div>

              {uploadStage === "uploading" && (
                <Progress value={uploadProgress} className="h-2" />
              )}

              {(uploadStage === "processing" || uploadStage === "saving") && (
                <Progress value={undefined} className="h-2" />
              )}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !isIAConnected}
            className="w-full hover:bg-primary/90 transition-all"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              "Upload Track"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
