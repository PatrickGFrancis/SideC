"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Album {
  id: string
  title: string
  description: string
  cover_image_url: string | null
  created_at: string
}

interface AlbumGridProps {
  albums: Album[]
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">No albums available yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <Card key={album.id} className="overflow-hidden transition-shadow hover:shadow-lg">
          {album.cover_image_url && (
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={album.cover_image_url || "/placeholder.svg"}
                alt={album.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-balance">{album.title}</CardTitle>
            {album.description && <CardDescription className="text-pretty">{album.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <Link href={`/album/${album.id}`}>
              <Button className="w-full">View Album</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
