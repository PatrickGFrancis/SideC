'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface IACredentialsFormProps {
  existingAccessKey?: string;
  existingSecretKey?: string;
}

export function IACredentialsForm({ existingAccessKey, existingSecretKey }: IACredentialsFormProps) {
  const [accessKey, setAccessKey] = useState(existingAccessKey || '');
  const [secretKey, setSecretKey] = useState(existingSecretKey || '');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    if (!accessKey || !secretKey) {
      toast({
        title: 'Missing credentials',
        description: 'Please provide both Access Key and Secret Key.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/ia-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey, secretKey }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Credentials saved!',
          description: 'You can now upload tracks to your Internet Archive account.',
        });
        router.refresh();
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IA Credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="accessKey">Access Key</Label>
          <Input
            id="accessKey"
            type="text"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            placeholder="Your IA Access Key"
          />
        </div>

        <div>
          <Label htmlFor="secretKey">Secret Key</Label>
          <div className="relative">
            <Input
              id="secretKey"
              type={showSecretKey ? 'text' : 'password'}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Your IA Secret Key"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowSecretKey(!showSecretKey)}
            >
              {showSecretKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : existingAccessKey ? 'Update Credentials' : 'Save Credentials'}
        </Button>
      </CardContent>
    </Card>
  );
}