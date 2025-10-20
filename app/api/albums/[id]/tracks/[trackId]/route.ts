import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackId: string }> }
) {
  try {
    const { id, trackId } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.text();
    const { deleteFromIA = false } = body ? JSON.parse(body) : {};

    // Verify album belongs to user
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (albumError || !album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Get track info before deleting
    const { data: track, error: trackError } = await supabase
      .from("tracks")
      .select("id, playback_url")
      .eq("id", trackId)
      .eq("album_id", id)
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    let iaDeleted = false;

    // Delete from IA if requested
    if (deleteFromIA && track.playback_url) {
      try {
        // Get user's IA credentials
        const { data: credentials } = await supabase
          .from("ia_credentials")
          .select("ia_username, ia_password")
          .eq("user_id", user.id)
          .single();

        if (credentials) {
          // Extract identifier from playback URL
          const match = track.playback_url.match(
            /archive\.org\/download\/([^/]+)/
          );
          if (match) {
            const identifier = match[1];

            // Use IA's metadata API to mark for deletion
            const formData = new URLSearchParams();
            formData.append("-target", "metadata");
            formData.append(
              "-patch",
              JSON.stringify({ op: "add", path: "/mediatype", value: "data" })
            );

            const metadataResponse = await fetch(
              `https://archive.org/metadata/${identifier}`,
              {
                method: "POST",
                headers: {
                  Authorization: `LOW ${credentials.ia_username}:${credentials.ia_password}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
              }
            );

            // Now delete the item using simple S3 DELETE
            const s3Response = await fetch(
              `https://s3.us.archive.org/${identifier}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `LOW ${credentials.ia_username}:${credentials.ia_password}`,
                },
              }
            );

            console.log(
              "IA S3 delete response:",
              s3Response.status,
              await s3Response.text()
            );

            if (
              s3Response.ok ||
              s3Response.status === 204 ||
              s3Response.status === 404
            ) {
              iaDeleted = true;
            } else {
              console.warn("Failed to delete from IA:", s3Response.status);
            }
          }
        }
      } catch (error) {
        console.error("Error deleting from IA:", error);
      }
    }

    // Delete track from database
    const { error: deleteError } = await supabase
      .from("tracks")
      .delete()
      .eq("id", trackId)
      .eq("album_id", id);

    if (deleteError) {
      console.error("Error deleting track:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete track" },
        { status: 500 }
      );
    }

    // Re-number remaining tracks using the 'track_number' column
    const { data: remainingTracks, error: fetchError } = await supabase
      .from("tracks")
      .select("id")
      .eq("album_id", id)
      .order("track_number", { ascending: true });

    if (!fetchError && remainingTracks) {
      for (let i = 0; i < remainingTracks.length; i++) {
        await supabase
          .from("tracks")
          .update({ track_number: i + 1 })
          .eq("id", remainingTracks[i].id);
      }
    }

    // Revalidate the album page cache so router.refresh() gets fresh data
    revalidatePath(`/album/${id}`);

    return NextResponse.json({
      success: true,
      iaDeleted: iaDeleted,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}