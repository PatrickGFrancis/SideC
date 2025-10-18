import { getAllAlbums } from "@/lib/data";
import { UserMenu } from "@/components/user-menu";
import { QuickCreateAlbum } from "@/components/quick-create-album";
import { AlbumCard } from "@/components/album-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Loading skeleton for albums
function AlbumsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Separate component for albums list
async function AlbumsList() {
  const albums = await getAllAlbums();

  if (albums.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="rounded-2xl bg-card/50 border border-border/50 p-12 max-w-md">
          <h2 className="text-2xl font-semibold mb-2">No albums yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first album to get started
          </p>
          <QuickCreateAlbum />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with subtle border */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-sans text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Music
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <QuickCreateAlbum />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<AlbumsSkeleton />}>
          <AlbumsList />
        </Suspense>
      </main>
    </div>
  );
}