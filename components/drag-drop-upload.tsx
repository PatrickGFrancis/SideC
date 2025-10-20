'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useOptimisticTracks } from '@/contexts/optimistic-tracks-context';
import { Upload } from 'lucide-react';

interface DragDropUploadProps {
  albumId: string;
  isIAConnected: boolean;
  iaCredentials: { username: string; password: string } | null;
}

export function DragDropUpload({ albumId, isIAConnected, iaCredentials }: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { addOptimisticTrack, updateOptimisticTrack, removeOptimisticTrack } = useOptimisticTracks();

  // Prevent default drag behavior globally
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: DragEvent) => {
      preventDefaults(e);
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      preventDefaults(e);
      // Only hide if we're leaving the window
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      preventDefaults(e);
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    // Add listeners to document and window
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.addEventListener(eventName, preventDefaults, false);
    });

    document.addEventListener('dragenter', handleDragEnter, false);
    document.addEventListener('dragleave', handleDragLeave, false);
    document.addEventListener('dragover', handleDragOver, false);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.removeEventListener(eventName, preventDefaults, false);
      });
      document.removeEventListener('dragenter', handleDragEnter, false);
      document.removeEventListener('dragleave', handleDragLeave, false);
      document.removeEventListener('dragover', handleDragOver, false);
    };
  }, []);

  const uploadFile = async (file: File) => {
    if (!isIAConnected || !iaCredentials) {
      toast({
        title: 'Setup required',
        description: 'Please add your Internet Archive credentials in Settings first.',
        variant: 'destructive',
      });
      return;
    }

    const optimisticTrackId = `temp-${Date.now()}`;
    const title = file.name.replace(/\.[^/.]+$/, '');

    setTimeout(() => {
      addOptimisticTrack({
        id: optimisticTrackId,
        title,
        artist: 'Unknown Artist',
        order: 999,
        albumId,
        isUploading: true,
        uploadProgress: 0,
      });
    }, 0);

    const updateProgress = (progress: number) => {
      setTimeout(() => {
        updateOptimisticTrack(optimisticTrackId, { uploadProgress: progress });
      }, 0);
    };

    const iaFormData = new FormData();
    iaFormData.append('file', file);
    iaFormData.append('iaUsername', iaCredentials.username);
    iaFormData.append('iaPassword', iaCredentials.password);
    iaFormData.append('title', title);
    iaFormData.append('artist', 'Unknown Artist');

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const estimatedSeconds = Math.max(10, (file.size / 1024 / 1024) * 2);
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 2, 95);
        updateProgress(currentProgress);
      }, (estimatedSeconds / 50) * 1000);

      const response = await fetch('/api/upload-to-ia', {
        method: 'POST',
        body: iaFormData,
      });

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      const iaData = await response.json();

      if (!iaData.success) {
        throw new Error(iaData.error || 'Upload failed');
      }

      updateProgress(100);

      let fetchedDuration = 0;
      try {
        const audioForDuration = new Audio();
        audioForDuration.preload = 'metadata';

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

          audioForDuration.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            fetchedDuration = Math.floor(audioForDuration.duration);
            resolve(null);
          });

          audioForDuration.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load audio'));
          });

          audioForDuration.src = URL.createObjectURL(file);
        });
      } catch (error) {
        console.warn('Could not fetch duration from file:', error);
      }

      const trackData = {
        title,
        artist: 'Unknown Artist',
        playbackUrl: iaData.playbackUrl,
        iaDetailsUrl: iaData.iaDetailsUrl,
        fileName: file.name,
        duration: fetchedDuration,
      };

      const dbResponse = await fetch(`/api/albums/${albumId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      });

      const result = await dbResponse.json();

      if (result.success) {
        setTimeout(() => {
          removeOptimisticTrack(optimisticTrackId);
        }, 0);

        setTimeout(() => {
          router.refresh();
        }, 100);

        toast({
          title: 'Upload complete!',
          description: `"${title}" has been added to the album.`,
        });
      } else {
        throw new Error('Failed to save track');
      }
    } catch (error: any) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      setTimeout(() => {
        removeOptimisticTrack(optimisticTrackId);
      }, 0);

      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter((file) => file.type.startsWith('audio/'));

      if (audioFiles.length === 0) {
        toast({
          title: 'Invalid file type',
          description: 'Please drop audio files only.',
          variant: 'destructive',
        });
        return;
      }

      for (const file of audioFiles) {
        await uploadFile(file);
      }
    },
    [albumId, isIAConnected, iaCredentials]
  );

  useEffect(() => {
    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (!e.dataTransfer?.files) return;

      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        dataTransfer: e.dataTransfer,
      } as React.DragEvent;

      handleDrop(syntheticEvent);
    };

    document.addEventListener('drop', handleDocumentDrop, false);

    return () => {
      document.removeEventListener('drop', handleDocumentDrop, false);
    };
  }, [handleDrop]);

  return (
    <>
      {isDragging && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-primary rounded-2xl p-12 bg-secondary/30">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  Drop your music here
                </p>
                <p className="text-muted-foreground mt-2">
                  Release to upload tracks to this album
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}