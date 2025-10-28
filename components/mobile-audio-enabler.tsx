"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

export function MobileAudioEnabler() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Only run on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if audio was already enabled in this session
    const audioEnabled = sessionStorage.getItem("audioEnabled");
    if (audioEnabled) {
      setIsEnabled(true);
      return;
    }

    // Listen for first play attempt
    const handlePlayAttempt = () => {
      if (!isEnabled) {
        setShowPrompt(true);
      }
    };

    // Listen for when a track is set (indicates user tried to play)
    window.addEventListener("audioPlayAttempt", handlePlayAttempt);

    return () => {
      window.removeEventListener("audioPlayAttempt", handlePlayAttempt);
    };
  }, [isEnabled]);

  const handleEnableAudio = () => {
    // Create a temporary audio element and play/pause it
    // This initializes the audio context with a user gesture
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          
          // Mark as enabled
          setIsEnabled(true);
          setShowPrompt(false);
          sessionStorage.setItem("audioEnabled", "true");
          
          // Trigger audio context resume globally
          window.dispatchEvent(new CustomEvent("audioEnabled"));
        })
        .catch((error) => {
          console.error("Failed to enable audio:", error);
        });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8 max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Volume2 className="h-10 w-10 text-primary" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Enable Audio</h2>
          <p className="text-muted-foreground">
            Tap the button below to enable audio playback on your device
          </p>
        </div>

        <Button
          onClick={handleEnableAudio}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
        >
          Enable Audio
        </Button>
      </div>
    </div>
  );
}