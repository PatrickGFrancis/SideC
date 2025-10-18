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

    const formData = await request.formData();
    const coverFile = formData.get("cover") as Blob;

    if (!coverFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify album belongs to user and get old cover URL
    const { data: album, error: albumError } = await supabase
      .from("albums")
      .select("id, cover_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (albumError || !album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Delete old cover from storage if it exists
    if (album.cover_url && album.cover_url.includes("album-covers")) {
      try {
        // Extract filename from URL
        const oldFileName = album.cover_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage.from("album-covers").remove([oldFileName]);
        }
      } catch (error) {
        console.error("Error deleting old cover:", error);
        // Continue anyway - don't fail the upload
      }
    }

    // Convert blob to buffer
    const arrayBuffer = await coverFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage with retry logic
    const fileName = `${id}-${Date.now()}.jpg`;
    let uploadData, uploadError;

    // Try upload up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await supabase.storage
        .from("album-covers")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      uploadData = result.data;
      uploadError = result.error;

      if (!uploadError) break; // Success, exit retry loop

      console.log(`Upload attempt ${attempt} failed:`, uploadError);

      if (attempt < 3) {
        // Wait 1 second before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (uploadError) {
      console.error(
        "Error uploading to storage after 3 attempts:",
        uploadError
      );
      return NextResponse.json(
        { error: "Failed to upload image after multiple attempts" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("album-covers").getPublicUrl(fileName);

    // Update album cover URL
    const { error: updateError } = await supabase
      .from("albums")
      .update({ cover_url: publicUrl })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating cover:", updateError);
      return NextResponse.json(
        { error: "Failed to update cover" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, coverUrl: publicUrl });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
