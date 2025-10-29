import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Music, Clock, Bookmark } from "lucide-react";
import { getAlbumById } from "@/lib/data";
import { TrackStatusChecker } from "@/components/track-status-checker";
import { UploadAlbumCover } from "@/components/upload-album-cover";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { TrackDurationFetcher } from "@/components/track-duration-fetcher";
import { AlbumPageClient } from "@/components/album-page-client";
import { AlbumActionsMenu } from "@/components/album-actions-menu";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper functions for duration formatting
function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${mins} min`;
  }
  return `${mins} min`;
}

// Add metadata for better SEO and performance
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const album = await getAlbumById(id);

  if (!album) {
    return {
      title: "Album Not Found",
    };
  }

  return {
    title: `${album.title} - ${album.artist}`,
    description:
      album.description || `Listen to ${album.title} by ${album.artist}`,
  };
}

// Loading skeleton component
function AlbumSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-9 w-32 mb-4" />
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <Skeleton className="h-48 w-48 rounded-xl mx-auto md:mx-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4 mx-auto md:mx-0" />
              <Skeleton className="h-6 w-1/2 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 mb-32">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

// Main album content component
async function AlbumContent({ id }: { id: string }) {
  const album = await getAlbumById(id);

  if (!album) {
    notFound();
  }

  const isOwned = album.isOwned !== false; // Default to true for backward compatibility

  // Debug: Log what durations we're getting
  console.log(
    "Album tracks durations:",
    album.tracks.map((t) => ({
      title: t.title,
      duration: t.duration,
      type: typeof t.duration,
    }))
  );

  // Calculate total duration
  const totalDuration = album.tracks.reduce((sum, track) => {
    return sum + (typeof track.duration === "number" ? track.duration : 0);
  }, 0);

  const totalDurationText = formatTotalDuration(totalDuration);

  return (
    <div className="min-h-screen bg-background">
      {isOwned && (
        <>
          <TrackStatusChecker tracks={album.tracks} albumId={id} />
          <TrackDurationFetcher tracks={album.tracks} albumId={id} />
        </>
      )}

      {/* Enhanced header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" prefetch={true}>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 hover:bg-secondary/50 hover:text-primary transition-all"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Albums
            </Button>
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Album cover */}
            <div className="relative group mx-auto md:mx-0">
              <div className="h-48 w-48 overflow-hidden rounded-xl bg-secondary/30 shadow-lg ring-1 ring-border/50">
                <Image
                  src={album.coverUrl || "/placeholder.svg"}
                  alt={album.title}
                  width={192}
                  height={192}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  priority
                />
              </div>
              {/* Only show upload cover option if owned */}
              {isOwned && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-xl">
                  <UploadAlbumCover albumId={id} />
                </div>
              )}
              {/* Show "Saved" badge if not owned */}
              {!isOwned && (
                <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-lg">
                  <Bookmark className="h-4 w-4 fill-current" />
                  Saved
                </div>
              )}
            </div>

            {/* Album info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <h1 className="font-sans text-4xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {album.title}
                  </h1>
                  <p className="mt-2 text-xl text-muted-foreground">
                    {album.artist}
                  </p>
                  {album.description && (
                    <p className="mt-4 text-base text-muted-foreground/90 text-pretty max-w-2xl mx-auto md:mx-0">
                      {album.description}
                    </p>
                  )}
                  {album.releaseDate && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Released:{" "}
                      {(() => {
                        const [year, month, day] = album.releaseDate
                          .split("T")[0]
                          .split("-");
                        return `${month}/${day}/${year}`;
                      })()}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>
                        {album.tracks.length}{" "}
                        {album.tracks.length === 1 ? "track" : "tracks"}
                      </span>
                    </div>
                    {totalDurationText && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{totalDurationText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button - only show menu if owned */}
                {isOwned && (
                  <div className="flex gap-2 flex-shrink-0 justify-center md:justify-end">
                    <AlbumActionsMenu
                      albumId={id}
                      albumTitle={album.title}
                      isPublic={album.isPublic || false}
                      currentTitle={album.title}
                      currentArtist={album.artist}
                      currentDescription={album.description}
                      currentReleaseDate={album.releaseDate}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8 pb-player-safe mb-32">
        {album.tracks.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground/90">
                  No tracks yet
                </p>
                {isOwned && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the menu to upload your first track
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <AudioPlayer
            tracks={album.tracks}
            albumTitle={album.title}
            albumId={id}
            coverUrl={album.coverUrl}
            isGuest={!isOwned}
          />
        )}
      </main>
    </div>
  );
}

export default async function AlbumPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AlbumPageClient albumId={id}>
      <Suspense fallback={<AlbumSkeleton />}>
        <AlbumContent id={id} />
      </Suspense>
    </AlbumPageClient>
  );
}