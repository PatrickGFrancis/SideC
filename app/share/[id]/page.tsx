import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Music, Clock, Lock } from "lucide-react";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper function for duration formatting
function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} hr ${mins} min`;
  }
  return `${mins} min`;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  
  // Create anonymous Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: album } = await supabase
    .from("albums")
    .select("title, artist, description")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!album) {
    return { title: "Album Not Found" };
  }

  return {
    title: `${album.title} - ${album.artist}`,
    description: album.description || `Listen to ${album.title} by ${album.artist}`,
  };
}

export default async function ShareAlbumPage({ params }: PageProps) {
  const { id } = await params;

  // Create anonymous Supabase client (no auth required)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch public album with tracks
  const { data: album, error } = await supabase
    .from("albums")
    .select(`
      *,
      tracks (*)
    `)
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (error || !album) {
    notFound();
  }

  // Sort tracks by order
  const sortedTracks = album.tracks?.sort((a: any, b: any) => a.order - b.order) || [];

  // Calculate total duration
  const totalDuration = sortedTracks.reduce((sum: number, track: any) => {
    return sum + (typeof track.duration === "number" ? track.duration : 0);
  }, 0);

  const totalDurationText = formatTotalDuration(totalDuration);

  return (
    <div className="min-h-screen bg-background">
      {/* Guest view header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 hover:bg-secondary/50 hover:text-primary transition-all"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Create Your Own
            </Button>
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Album cover */}
            <div className="relative mx-auto md:mx-0">
              <div className="h-48 w-48 overflow-hidden rounded-xl bg-secondary/30 shadow-lg ring-1 ring-border/50">
                <Image
                  src={album.cover_url || "/placeholder.svg"}
                  alt={album.title}
                  width={192}
                  height={192}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>

            {/* Album info */}
            <div className="flex-1">
              <div className="flex flex-col gap-4 text-center md:text-left">
                <div>
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
                  {album.release_date && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Released:{" "}
                      {(() => {
                        const [year, month, day] = album.release_date
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
                        {sortedTracks.length}{" "}
                        {sortedTracks.length === 1 ? "track" : "tracks"}
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

                {/* Guest badge */}
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full w-fit mx-auto md:mx-0">
                  <Lock className="h-3 w-3" />
                  <span>Viewing as guest</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8 pb-32">
        {sortedTracks.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground/90">
                No tracks yet
              </p>
            </div>
          </div>
        ) : (
          <AudioPlayer
            tracks={sortedTracks}
            albumTitle={album.title}
            albumId={id}
            coverUrl={album.cover_url}
            isGuest={true}
          />
        )}
      </main>
    </div>
  );
}