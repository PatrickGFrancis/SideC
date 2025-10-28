import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, artist, playbackUrl, fileName, duration } = await request.json();

    // Verify album belongs to user
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .select("id, artist")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (albumError || !album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Get the highest track_number to add at the end
    const { data: lastTrack } = await supabase
      .from("tracks")
      .select("track_number")
      .eq("album_id", id)
      .order("track_number", { ascending: false })
      .limit(1)
      .single();

    const trackNumber = lastTrack ? lastTrack.track_number + 1 : 1;

    // Convert duration from seconds to "M:SS" format
    const formatDuration = (seconds: number | null) => {
      if (!seconds) return null;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Insert track with duration
    const { data: track, error: insertError } = await supabase
      .from("tracks")
      .insert({
        album_id: id,
        title,
        artist,
        playback_url: playbackUrl,
        track_number: trackNumber,
        processing: true,
        duration: formatDuration(duration), // Convert to "M:SS" format
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating track:", insertError);
      return NextResponse.json(
        { error: "Failed to create track" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      track: {
        id: track.id,
        title: track.title,
        artist: track.artist,
        trackNumber: track.track_number,
        playbackUrl: track.playback_url,
        processing: track.processing,
        duration: track.duration,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}