import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { albumId } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        isSaved: false,
      });
    }

    // Check if album is saved
    const { data: savedAlbum } = await supabase
      .from("saved_albums")
      .select("id")
      .eq("user_id", user.id)
      .eq("album_id", albumId)
      .single();

    return NextResponse.json({
      isAuthenticated: true,
      isSaved: !!savedAlbum,
    });
  } catch (error) {
    return NextResponse.json(
      { isAuthenticated: false, isSaved: false },
      { status: 500 }
    );
  }
}