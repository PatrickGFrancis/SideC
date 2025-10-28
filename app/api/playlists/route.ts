import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET all playlists
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: playlists, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching playlists:", error);
      return NextResponse.json(
        { error: "Failed to fetch playlists" },
        { status: 500 }
      );
    }

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new playlist
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const { data: playlist, error } = await supabase
      .from("playlists")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating playlist:", error);
      return NextResponse.json(
        { error: "Failed to create playlist" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, playlist });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}