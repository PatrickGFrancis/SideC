import { getAllAlbums } from "@/lib/data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { QuickCreateAlbum } from "@/components/quick-create-album"
import { AlbumCard } from "@/components/album-card"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const albums = await getAllAlbums()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-sans text-3xl font-bold">My Music</h1>
            <div className="flex items-center gap-4">
              <QuickCreateAlbum />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {albums.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-semibold mb-2">No albums yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first album to get started
            </p>
            <QuickCreateAlbum />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}