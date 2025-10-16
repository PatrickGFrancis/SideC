'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadTrackToAlbumProps {
  albumId: string;
}

export function UploadTrackToAlbum({ albumId }: UploadTrackToAlbumProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isIAConnected, setIsIAConnected] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const iaUsername = localStorage.getItem('iaUsername');
    setIsIAConnected(!!iaUsername);
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(fileName);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !isIAConnected) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Uploading to Internet Archive...');

    const iaFormData = new FormData();
    iaFormData.append('file', file);
    iaFormData.append('iaUsername', localStorage.getItem('iaUsername') || '');
    iaFormData.append('iaPassword', localStorage.getItem('iaPassword') || '');
    iaFormData.append('title', title || file.name);
    iaFormData.append('artist', artist || 'Unknown Artist');

    try {
      // Upload to Internet Archive with progress tracking
      const iaData = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Show 0-90% for upload progress
            const percentComplete = Math.round((e.loaded / e.total) * 90);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            // Show 90% when upload completes, server is processing
            setUploadProgress(90);
            setUploadStatus('Processing on Internet Archive...');
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/upload-to-ia');
        xhr.send(iaFormData);
      });

      if (!iaData.success) {
        throw new Error('Failed to upload to Internet Archive');
      }

      // Show 95% when starting to add to album
      setUploadProgress(95);
      setUploadStatus('Adding to album...');

      // Step 2: Add track to album
      const trackResponse = await fetch(`/api/albums/${albumId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || file.name,
          artist: artist || 'Unknown Artist',
          playbackUrl: iaData.playbackUrl,
          fileName: iaData.fileName,
        }),
      });

      const trackData = await trackResponse.json();

      if (trackData.success) {
        setUploadProgress(100);
        setUploadStatus('Complete!');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
          title: 'Track uploaded! 🎵',
          description: `"${title}" has been added to the album.`,
        });
        setOpen(false);
        setFile(null);
        setTitle('');
        setArtist('');
        setUploadProgress(0);
        setUploadStatus('');
        router.refresh();
      } else {
        throw new Error('Failed to add track to album');
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Track
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Track</DialogTitle>
          <DialogDescription>
            Add a new track to this album
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="track-file">Audio File</Label>
            <Input
              id="track-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="track-title">Title</Label>
            <Input
              id="track-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="track-artist">Artist</Label>
            <Input
              id="track-artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {uploadStatus} {uploadProgress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !isIAConnected}
            className="w-full"
          >
            {uploading ? `${uploadStatus} ${uploadProgress}%` : 'Upload Track'}
          </Button>

          {!isIAConnected && (
            <p className="text-sm text-destructive">
              ⚠️ Please connect your Internet Archive account in Settings first
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}