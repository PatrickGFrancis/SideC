import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";

function createIASignature(
  method: string,
  bucket: string,
  key: string,
  contentType: string,
  date: string,
  accessKey: string,
  secretKey: string
) {
  const stringToSign = [
    method,
    "",
    contentType,
    date,
    "x-amz-auto-make-bucket:1",
    `/${bucket}/${key}`,
  ].join("\n");

  const signature = createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64");

  return `LOW ${accessKey}:${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, contentType, title, artist } = await request.json();

    // Get IA credentials from database
    const { createServerSupabaseClient } = await import("@/lib/supabase-server");
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: credentials, error: credError } = await supabase
      .from("ia_credentials")
      .select("access_key, secret_key")
      .eq("user_id", user.id)
      .single();

    if (credError || !credentials) {
      return NextResponse.json(
        { error: "IA credentials not found" },
        { status: 400 }
      );
    }

    const cleanUsername = credentials.access_key.trim();
    const cleanPassword = credentials.secret_key.trim();

    // Sanitize for IA
    const sanitizeForIA = (str: string) =>
      str
        .replace(/[^a-zA-Z0-9-]/g, "-")
        .replace(/-{2,}/g, "-")
        .toLowerCase();

    const sanitizedTitle = sanitizeForIA(title);
    const sanitizedArtist = sanitizeForIA(artist);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);

    const bucketName = `music-${timestamp}-${randomStr}`;
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

    const date = new Date().toUTCString();

    // Create signature
    const authorization = createIASignature(
      "PUT",
      bucketName,
      cleanFileName,
      contentType,
      date,
      cleanUsername,
      cleanPassword
    );

    const uploadUrl = `https://s3.us.archive.org/${bucketName}/${cleanFileName}`;

    // Return signed URL and headers for client to use
    return NextResponse.json({
      success: true,
      uploadUrl,
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
        Date: date,
        "x-amz-auto-make-bucket": "1",
        "x-archive-meta-mediatype": "audio",
        "x-archive-meta-title": sanitizedTitle,
        "x-archive-meta-creator": sanitizedArtist,
        "x-archive-meta01-collection": "opensource_audio",
      },
      playbackUrl: uploadUrl,
      iaDetailsUrl: `https://archive.org/details/${bucketName}`,
      identifier: bucketName,
    });
  } catch (error: any) {
    console.error("❌ Error generating signed URL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}