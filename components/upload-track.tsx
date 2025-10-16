'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function UploadTrack() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isIAConnected, setIsIAConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const iaUsername = localStorage.getItem('iaUsername');
    setIsIAConnected(!!iaUsername);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename if empty
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setTitle(fileName);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select an audio file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!isIAConnected) {
      toast({
        title: 'Account not connected',
        description: 'Please connect your Internet Archive account first.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('iaUsername', localStorage.getItem('iaUsername') || '');
    formData.append('iaPassword', localStorage.getItem('iaPassword') || '');
    formData.append('title', title || file.name);
    formData.append('artist', artist || 'Unknown Artist');

    try {
      const response = await fetch('/api/upload-to-ia', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Upload successful! 🎵',
          description: 'Your track is now available on Internet Archive.',
        });
        
        // Reset form
        setFile(null);
        setTitle('');
        setArtist('');
        
        // TODO: Add track to your albums.json
        console.log('Track uploaded:', data);
        
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Track</CardTitle>
        <CardDescription>
          Upload your music to Internet Archive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file">Audio File</Label>
          <Input
            id="file"
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
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
            disabled={uploading}
          />
        </div>
        
        <div>
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name"
            disabled={uploading}
          />
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Uploading to Internet Archive...
            </p>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={uploading || !file || !isIAConnected}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Track'}
        </Button>

        {!isIAConnected && (
          <p className="text-sm text-destructive">
            ⚠️ Please connect your Internet Archive account first
          </p>
        )}
      </CardContent>
    </Card>
  );
}