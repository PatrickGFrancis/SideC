import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Music } from "lucide-react";
import { getAlbumById } from "@/lib/data";
import { UploadTrackToAlbum } from "@/components/upload-track-to-album";
import { DeleteAlbum } from "@/components/delete-album";
import { TrackStatusChecker } from "@/components/track-status-checker";
import { UploadAlbumCover } from "@/components/upload-album-cover";
import { EditAlbum } from "@/components/edit-album";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";


interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
            <Skeleton className="h-48 w-48 rounded-xl" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-background">
      <TrackStatusChecker tracks={album.tracks} />

      {/* Enhanced header with dark theme */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
            {/* Album cover with enhanced styling */}
            <div className="relative group">
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
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-xl">
                <UploadAlbumCover albumId={id} />
              </div>
            </div>

            {/* Album info with gradient text */}
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h1 className="font-sans text-4xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {album.title}
                  </h1>
                  <p className="mt-2 text-xl text-muted-foreground">
                    {album.artist}
                  </p>
                  {album.description && (
                    <p className="mt-4 text-base text-muted-foreground/90 text-pretty max-w-2xl">
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
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Music className="h-4 w-4" />
                    <span>
                      {album.tracks.length}{" "}
                      {album.tracks.length === 1 ? "track" : "tracks"}
                    </span>
                  </div>
                </div>

                {/* Action buttons with Edit */}
                <div className="flex gap-2 flex-shrink-0">
                  <EditAlbum
                    albumId={id}
                    currentTitle={album.title}
                    currentArtist={album.artist}
                    currentDescription={album.description}
                    currentReleaseDate={album.releaseDate}
                  />
                  <UploadTrackToAlbum albumId={id} />
                  <DeleteAlbum albumId={id} albumTitle={album.title} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
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
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your first track to get started
                </p>
              </div>
              <UploadTrackToAlbum albumId={id} />
            </div>
          </div>
        ) : (
          <AudioPlayer
            tracks={album.tracks}
            albumTitle={album.title}
            albumId={id}
            coverUrl={album.coverUrl}
          />
        )}
      </main>
    </div>
  );
}

export default async function AlbumPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumContent id={id} />
    </Suspense>
  );
}
