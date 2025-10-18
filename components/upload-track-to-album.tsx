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
  const [iaCredentials, setIaCredentials] = useState<{ username: string; password: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if user has IA credentials
    const checkCredentials = async () => {
      try {
        const response = await fetch('/api/ia-credentials');
        const data = await response.json();
        setIsIAConnected(data.hasCredentials);
        if (data.hasCredentials) {
          setIaCredentials({
            username: data.username,
            password: data.password
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
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!file || !isIAConnected || !iaCredentials) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Uploading to Internet Archive...');

    const iaFormData = new FormData();
    iaFormData.append('file', file);
    iaFormData.append('iaUsername', iaCredentials.username);
    iaFormData.append('iaPassword', iaCredentials.password);
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
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', '/api/upload-to-ia');
        xhr.send(iaFormData);
      });

      // Now save track to database
      setUploadProgress(95);
      setUploadStatus('Saving track...');

      const trackData = {
        title: title || file.name,
        artist: artist || 'Unknown Artist',
        playbackUrl: iaData.playbackUrl,
        fileName: file.name,
      };

      const response = await fetch(`/api/albums/${albumId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        setUploadStatus('Complete!');
        toast({
          title: 'Track uploaded!',
          description: `"${title || file.name}" has been added to the album.`,
        });

        // Reset form
        setFile(null);
        setTitle('');
        setArtist('');
        setOpen(false);
        router.refresh();
      } else {
        throw new Error('Failed to save track');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again.',
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
          {!isIAConnected && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              ⚠️ Please add your Internet Archive credentials in Settings first
            </div>
          )}

          <div>
            <Label htmlFor="audio-file">Audio File</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={uploading || !isIAConnected}
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

          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !isIAConnected}
            className="w-full"
          >
            {uploading ? `${uploadStatus} ${uploadProgress}%` : 'Upload Track'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}