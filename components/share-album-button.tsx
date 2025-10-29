"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ShareAlbumButtonProps {
  albumId: string;
  isPublic: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ShareAlbumButton({
  albumId,
  isPublic: initialIsPublic,
  isOpen,
  onOpenChange,
}: ShareAlbumButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const { toast } = useToast();

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Get share URL only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/share/${albumId}`);
    }
  }, [albumId]);

  const togglePublic = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (response.ok) {
        setIsPublic(!isPublic);
        toast({
          title: !isPublic ? "Album is now public" : "Album is now private",
          description: !isPublic
            ? "Anyone with the link can view"
            : "Only you can view",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update",
        variant: "destructive",
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share this link with anyone",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Album</DialogTitle>
          <DialogDescription>
            Make this album public and share it with anyone
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="public-toggle">Public Album</Label>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={togglePublic}
            />
          </div>

          {isPublic && shareUrl && (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-muted rounded-md text-sm"
                />
                <Button onClick={copyLink} size="icon" variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
