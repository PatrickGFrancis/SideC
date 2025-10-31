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

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  type UploadStage =
    | "preparing"
    | "uploading"
    | "processing"
    | "saving"
    | "complete";

  const [uploadStage, setUploadStage] = useState<UploadStage>("preparing");
  const [isIAConnected, setIsIAConnected] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);
  const [iaCredentials, setIaCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { addOptimisticTrack, updateOptimisticTrack, removeOptimisticTrack } =
    useOptimisticTracks();

  useEffect(() => {
    const checkCredentials = async () => {
      setCheckingCredentials(true);
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
      } finally {
        setCheckingCredentials(false);
      }
    };

    if (open) {
      checkCredentials();
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
      
      // Show immediate feedback on mobile
      toast({
        title: "File selected",
        description: `${selectedFile.name} ready to upload`,
      });
    }
  };

  const getUploadStatusText = () => {
    switch (uploadStage) {
      case "preparing":
        return "Preparing upload...";
      case "uploading":
        return `Uploading to Internet Archive... ${uploadProgress}%`;
      case "processing":
        return "Waiting for Internet Archive to process file...";
      case "saving":
        return "Saving track to album...";
      case "complete":
        return "Upload complete!";
      default:
        return "";
    }
  };

  const pollForCDNUrl = async (
    identifier: string,
    fileName: string,
    trackId: string
  ) => {
    console.log("🔄 Polling for CDN URL in background...");

    let attempts = 0;

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;

      console.log(`Background check ${attempts}...`);

      try {
        const metadataResponse = await fetch(
          `https://archive.org/metadata/${identifier}`
        );
        const metadata = await metadataResponse.json();

        const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const fileMetadata = metadata.files?.find(
          (f: any) => f.name === cleanFileName
        );

        if (fileMetadata?.name) {
          const server = metadata.server || "archive.org";
          const dir = metadata.dir || "";
          const cdnUrl = `https://${server}${dir}/${fileMetadata.name}`;

          console.log("✅ Got CDN URL in background:", cdnUrl);

          await fetch(`/api/tracks/${trackId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playbackUrl: cdnUrl }),
          });

          router.refresh();

          console.log("✅ Track updated with CDN URL!");
          break;
        }
      } catch (e) {
        console.warn(`Background check ${attempts} failed:`, e);
      }

      if (attempts >= 100) {
        console.warn("⚠️ Stopped polling after 5 minutes");
        break;
      }
    }
  };

  const handleUpload = async () => {
    console.log("🚀 Upload started!");
    if (!file || !isIAConnected || !iaCredentials) return;

    const optimisticTrackId = `temp-${Date.now()}`;

    // Show immediate toast feedback
    toast({
      title: "Upload started",
      description: `Uploading ${title || file.name}...`,
    });

    // Add optimistic track IMMEDIATELY (before any async operations)
    addOptimisticTrack({
      id: optimisticTrackId,
      title: title || file.name,
      artist: artist || "Unknown Artist",
      order: 999,
      albumId: albumId,
      isUploading: true,
      uploadProgress: 0,
    });

    setUploading(true);
    setUploadProgress(0);
    setUploadStage("preparing");

    // Close dialog after adding optimistic track
    setOpen(false);

    const updateProgress = (progress: number) => {
      setUploadProgress(progress);
      updateOptimisticTrack(optimisticTrackId, { uploadProgress: progress });
    };

    try {
      setUploadStage("uploading");

      // Step 1: Get signed upload URL
      const signedUrlResponse = await fetch("/api/generate-ia-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "audio/mpeg",
          title: title || file.name,
          artist: artist || "Unknown Artist",
        }),
      });

      const signedData = await signedUrlResponse.json();

      if (!signedData.success) {
        throw new Error(signedData.error || "Failed to get upload URL");
      }

      // Step 2: Upload file directly to IA
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            updateProgress(Math.min(percentComplete, 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("PUT", signedData.uploadUrl);

        Object.entries(signedData.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });

        xhr.send(file);
      });

      updateProgress(100);
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

      setUploadStage("saving");

      // Save track with download URL
      const trackData = {
        title: title || file.name,
        artist: artist || "Unknown Artist",
        playbackUrl: signedData.playbackUrl,
        iaDetailsUrl: signedData.iaDetailsUrl,
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
        const newTrackId = result.track.id;

        setUploadStage("complete");
        
        // Show success toast
        toast({
          title: "Upload complete! 🎵",
          description: `${title || file.name} has been added to your album`,
        });

        // Reset form
        setFile(null);
        setTitle("");
        setArtist("");
        setUploadProgress(0);
        setUploadStage("preparing");
        setUploading(false);

        // Remove optimistic track
        removeOptimisticTrack(optimisticTrackId);

        // Refresh to show the real track
        router.refresh();

        // Poll for CDN URL in background
        pollForCDNUrl(signedData.identifier, file.name, newTrackId);
      } else {
        throw new Error("Failed to save track");
      }
    } catch (error: any) {
      // Remove optimistic track on error
      removeOptimisticTrack(optimisticTrackId);

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
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button className="gap-2 hover:bg-primary/90 transition-all min-h-[44px]">
            <Upload className="h-4 w-4" />
            Upload Track
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Upload Track</DialogTitle>
          <DialogDescription>Add a new track to this album</DialogDescription>
        </DialogHeader>
        
        {checkingCredentials ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Checking credentials...</span>
          </div>
        ) : (
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
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
                onChange={handleFileChange}
                disabled={uploading || !isIAConnected}
                className="cursor-pointer file:cursor-pointer min-h-[44px]"
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
                className="min-h-[44px]"
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
                className="min-h-[44px]"
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
              disabled={uploading || !file || !isIAConnected || checkingCredentials}
              className="w-full hover:bg-primary/90 transition-all min-h-[44px]"
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
        )}
      </DialogContent>
    </Dialog>
  );
}