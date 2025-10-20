'use client';

import { useState, useEffect } from 'react';
import { DragDropUpload } from '@/components/drag-drop-upload';

interface AlbumPageClientProps {
  albumId: string;
  children: React.ReactNode;
}

export function AlbumPageClient({ albumId, children }: AlbumPageClientProps) {
  const [isIAConnected, setIsIAConnected] = useState(false);
  const [iaCredentials, setIaCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const response = await fetch('/api/ia-credentials');
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
  }, []);

  return (
    <>
      {children}
      <DragDropUpload
        albumId={albumId}
        isIAConnected={isIAConnected}
        iaCredentials={iaCredentials}
      />
    </>
  );
}