import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAlbumById } from "@/lib/data";
import { UploadTrackToAlbum } from "@/components/upload-track-to-album";
import { DeleteAlbum } from "@/components/delete-album";
import { TrackStatusChecker } from "@/components/track-status-checker";
import { UploadAlbumCover } from "@/components/upload-album-cover";
import { TrackItem } from "@/components/track-item";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AlbumPage({ params }: PageProps) {
  const { id } = await params;
  const album = await getAlbumById(id);

  if (!album) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <TrackStatusChecker tracks={album.tracks} />

      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Albums
            </Button>
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative group">
              <div className="h-48 w-48 overflow-hidden rounded-lg bg-muted">
                <img
                  src={album.coverUrl || "/placeholder.svg"}
                  alt={album.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                <UploadAlbumCover albumId={id} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="font-sans text-4xl font-bold text-balance">
                    {album.title}
                  </h1>
                  <p className="mt-1 text-xl text-muted-foreground">
                    {album.artist}
                  </p>
                  {album.description && (
                    <p className="mt-3 text-lg text-muted-foreground text-pretty">
                      {album.description}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {album.tracks.length}{" "}
                    {album.tracks.length === 1 ? "track" : "tracks"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <UploadTrackToAlbum albumId={id} />
                  <DeleteAlbum albumId={id} albumTitle={album.title} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {album.tracks.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No tracks in this album yet</p>
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
