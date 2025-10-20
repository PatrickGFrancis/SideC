import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id: albumId } = await params;
    const { trackOrders } = await request.json();

    // trackOrders is an array of { id: string, order: number }
    
    // Update each track's order
    const updates = trackOrders.map(async (item: { id: string; order: number }) => {
      return supabase
        .from("tracks")
        .update({ order: item.order })
        .eq("id", item.id)
        .eq("album_id", albumId);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tracks:", error);
    return NextResponse.json(
      { error: "Failed to reorder tracks" },
      { status: 500 }
    );
  }
}