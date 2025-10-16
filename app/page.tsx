import { getAllAlbums } from "@/lib/data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Home() {
  const albums = getAllAlbums()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-sans text-3xl font-bold">My Music</h1>
            <Link href="/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Album
              </Button>
            </Link>
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
            <Link href="/create">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Album
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted shadow-md transition-all group-hover:shadow-xl group-hover:scale-105">
                    <img
                      src={album.coverUrl || "/placeholder.svg"}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                      {album.title}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {album.artist}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}