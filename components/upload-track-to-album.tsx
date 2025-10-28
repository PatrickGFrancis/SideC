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

    setOpen(false);
    setUploading(true);
    setUploadProgress(0);
    setUploadStage("preparing");

    const optimisticTrackId = `temp-${Date.now()}`;

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

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadStage("uploading");

      // Step 1: Get signed upload URL from our API (no file sent)
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

      // Step 2: Upload file directly to IA using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            updateProgress(Math.min(percentComplete, 95));
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

        // Set all headers from the server (Date is not included to avoid browser blocking)
        Object.entries(signedData.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });

        xhr.send(file);
      });

      updateProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadStage("processing");

      // Fetch the real CDN URL from IA metadata
      let finalPlaybackUrl = signedData.playbackUrl;
      try {
        // Wait a bit for IA to process
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const metadataResponse = await fetch(
          `https://archive.org/metadata/${signedData.identifier}`
        );
        const metadata = await metadataResponse.json();

        // Find the uploaded file in the metadata
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const fileMetadata = metadata.files?.find(
          (f: any) => f.name === cleanFileName
        );

        if (fileMetadata?.name) {
          // Construct the CDN URL from metadata
          const server = metadata.server || "archive.org";
          const dir = metadata.dir || "";
          finalPlaybackUrl = `https://${server}${dir}/${fileMetadata.name}`;
          console.log("✅ Got CDN URL:", finalPlaybackUrl);
        } else {
          console.warn("⚠️ File not found in metadata yet, using download URL");
        }
      } catch (error) {
        console.warn(
          "Could not fetch CDN URL from IA, using download URL:",
          error
        );
      }

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
        playbackUrl: finalPlaybackUrl, // ✅ Use the CDN URL!
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
        setUploadStage("complete");

        setTimeout(() => {
          removeOptimisticTrack(optimisticTrackId);
        }, 0);

        setFile(null);
        setTitle("");
        setArtist("");
        setUploadProgress(0);
        setUploadStage("preparing");
        setUploading(false);

        setTimeout(() => {
          router.refresh();
        }, 100);
      } else {
        throw new Error("Failed to save track");
      }
    } catch (error: any) {
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
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac"
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
