import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, artist, coverUrl, releaseDate, description } =
      await request.json();

    // Insert album into database
    const { data, error } = await supabase
      .from("albums")
      .insert({
        user_id: user.id,
        title,
        artist,
        cover_url: coverUrl,
        release_date: releaseDate,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating album:", error);
      return NextResponse.json(
        { error: "Failed to create album" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      album: {
        id: data.id,
        title: data.title,
        artist: data.artist,
        coverUrl: data.cover_url,
        releaseDate: data.release_date,
        description: data.description,
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

export async function PATCH(
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

    const { title, artist, description, releaseDate } = await request.json();

    // Update album
    const { error: updateError } = await supabase
      .from("albums")
      .update({
        title,
        artist,
        description,
        release_date: releaseDate,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating album:", updateError);
      return NextResponse.json(
        { error: "Failed to update album" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get the album with tracks and cover info
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .select("*, tracks(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (albumError || !album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Delete album cover from storage if it exists
    if (album.cover_url && album.cover_url.includes("album-covers")) {
      try {
        const fileName = album.cover_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("album-covers").remove([fileName]);
        }
      } catch (error) {
        console.error("Error deleting album cover:", error);
        // Continue anyway - don't fail the deletion
      }
    }

    // Store in deleted_albums for potential undo functionality
    await supabase.from("deleted_albums").insert({
      user_id: user.id,
      album_data: album,
    });

    // Delete album (tracks will cascade delete automatically due to foreign key)
    const { error: deleteError } = await supabase
      .from("albums")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting album:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete album" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}