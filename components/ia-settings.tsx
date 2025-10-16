'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function IASettings() {
  const [iaUsername, setIaUsername] = useState('');
  const [iaPassword, setIaPassword] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if IA credentials are saved
    const savedUsername = localStorage.getItem('iaUsername');
    if (savedUsername) {
      setIaUsername(savedUsername);
      setIsConnected(true);
    }
  }, []);

  const handleSave = () => {
    if (!iaUsername || !iaPassword) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both S3 keys.',
        variant: 'destructive',
      });
      return;
    }

    localStorage.setItem('iaUsername', iaUsername);
    localStorage.setItem('iaPassword', iaPassword);
    setIsConnected(true);

    toast({
      title: 'Connected!',
      description: 'Your Internet Archive S3 keys are now linked.',
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem('iaUsername');
    localStorage.removeItem('iaPassword');
    setIaUsername('');
    setIaPassword('');
    setIsConnected(false);

    toast({
      title: 'Disconnected',
      description: 'Internet Archive account unlinked.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internet Archive Account</CardTitle>
        <CardDescription>
          Link your Internet Archive S3 keys to automatically upload your music
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ia-username">S3 Access Key</Label>
          <Input
            id="ia-username"
            type="text"
            value={iaUsername}
            onChange={(e) => setIaUsername(e.target.value)}
            disabled={isConnected}
            placeholder="XA2RBGR9K50FjeHV"
          />
        </div>

        <div>
          <Label htmlFor="ia-password">S3 Secret Key</Label>
          <Input
            id="ia-password"
            type="password"
            value={iaPassword}
            onChange={(e) => setIaPassword(e.target.value)}
            disabled={isConnected}
            placeholder="••••••••••••••••"
          />
        </div>

        {isConnected ? (
          <Button onClick={handleDisconnect} variant="destructive">
            Disconnect Account
          </Button>
        ) : (
          <Button onClick={handleSave}>
            Connect S3 Keys
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          Get your S3 keys at{' '}
          <a 
            href="https://archive.org/account/s3.php" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
          >
            archive.org/account/s3.php
          </a>
        </p>
      </CardContent>
    </Card>
  );
}