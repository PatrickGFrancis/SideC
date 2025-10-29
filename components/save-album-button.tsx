"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface SaveAlbumButtonProps {
  albumId: string;
  albumTitle: string;
}

export function SaveAlbumButton({ albumId, albumTitle }: SaveAlbumButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuthAndSaveStatus();
  }, [albumId]);

  // Auto-save after login if saveAlbum param exists
  useEffect(() => {
    const shouldAutoSave = searchParams.get("autoSave");
    if (shouldAutoSave === "true" && isAuthenticated && !isSaved && !isLoading) {
      handleSave(true);
    }
  }, [isAuthenticated, isSaved, searchParams]);

  const checkAuthAndSaveStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const response = await fetch("/api/check-saved-album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });

      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      setIsSaved(data.isSaved || false);
    } catch (error) {
      console.error("Error checking save status:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      const currentUrl = window.location.pathname;
      router.push(`/auth/login?returnTo=${encodeURIComponent(currentUrl)}&autoSave=true`);
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        // Unsave
        const response = await fetch("/api/saved-albums", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        });

        if (response.ok) {
          setIsSaved(false);
          toast({
            title: "Removed from library",
            description: `"${albumTitle}" has been removed from your library.`,
          });
        } else {
          throw new Error("Failed to unsave");
        }
      } else {
        // Save
        const response = await fetch("/api/saved-albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        });

        if (response.ok) {
          setIsSaved(true);
          if (!isAutoSave) {
            toast({
              title: "Saved to library",
              description: `"${albumTitle}" has been added to your library.`,
            });
          }
        } else {
          throw new Error("Failed to save");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to update library. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <Button variant="outline" disabled size="lg" className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      onClick={() => handleSave()}
      disabled={isLoading}
      variant={isSaved ? "default" : "outline"}
      size="lg"
      className="gap-2 transition-all hover:scale-105 active:scale-95"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          Saved
        </>
      ) : (
        <>
          <BookmarkPlus className="h-4 w-4" />
          {isAuthenticated ? "Save to Library" : "Sign in to Save"}
        </>
      )}
    </Button>
  );
}