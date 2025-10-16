"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-sans text-4xl font-bold">Admin Dashboard</h1>

        <Card>
          <CardHeader>
            <CardTitle>Manage Your Albums</CardTitle>
            <CardDescription>Edit the albums.json file to add or update content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                To add or edit albums, open <code className="rounded bg-muted px-1 py-0.5">data/albums.json</code> and
                update the content directly.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Album Structure:</h3>
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
                  {`{
  "id": "unique-id",
  "title": "Album Title",
  "artist": "Artist Name",
  "coverUrl": "https://...",
  "releaseDate": "2024-01-01",
  "description": "Album description",
  "tracks": [
    {
      "id": "track-1",
      "title": "Track Title",
      "trackNumber": 1,
      "audioUrl": "https://youtube.com/...",
      "duration": "3:45"
    }
  ]
}`}
                </pre>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">Supported Audio URLs:</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>YouTube: https://www.youtube.com/watch?v=...</li>
                  <li>Internet Archive: https://archive.org/download/...</li>
                  <li>Direct MP3/audio file URLs</li>
                  <li>Any publicly accessible audio URL</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
