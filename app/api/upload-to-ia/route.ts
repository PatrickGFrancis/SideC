import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 300;

function createIASignature(
  method: string,
  bucket: string,
  key: string,
  contentType: string,
  date: string,
  accessKey: string,
  secretKey: string
) {
  // Only include x-amz-auto-make-bucket in signature
  const stringToSign = [
    method,
    "", // Content-MD5
    contentType,
    date,
    "x-amz-auto-make-bucket:1",
    `/${bucket}/${key}`,
  ].join("\n");

  console.log("String to sign:");
  console.log(stringToSign);

  const signature = createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64");

  return `LOW ${accessKey}:${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const iaUsername = formData.get("iaUsername") as string;
    const iaPassword = formData.get("iaPassword") as string;
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;

    if (!file || !iaUsername || !iaPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cleanUsername = iaUsername.trim();
    const cleanPassword = iaPassword.trim();

    console.log("=== IA UPLOAD ===");
    console.log("Access Key:", cleanUsername);
    console.log("Access Key length:", cleanUsername.length);

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
    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const contentType = file.type || "audio/mpeg";

    console.log("Bucket:", bucketName);
    console.log("Filename:", fileName);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const date = new Date().toUTCString();

    // Create signature
    const authorization = createIASignature(
      "PUT",
      bucketName,
      fileName,
      contentType,
      date,
      cleanUsername,
      cleanPassword
    );

    console.log("Authorization created");

    // Upload to Internet Archive
    const uploadUrl = `https://s3.us.archive.org/${bucketName}/${fileName}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
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
      body: fileBuffer,
    });

    console.log("Response status:", uploadResponse.status);
    const responseText = await uploadResponse.text();
    console.log("Response body:", responseText.substring(0, 500));

    if (!uploadResponse.ok) {
      throw new Error(
        `IA upload failed: ${uploadResponse.status} - ${responseText}`
      );
    }

    // Around line 107-115, change back to:
    const playbackUrl = `https://s3.us.archive.org/${bucketName}/${fileName}`;

    const iaDetailsUrl = `https://archive.org/details/${bucketName}`;

    console.log("✅ Upload successful!");
    console.log("Playback URL:", playbackUrl);
    console.log("IA Details URL:", iaDetailsUrl);

    return NextResponse.json({
      success: true,
      playbackUrl,
      iaDetailsUrl,
      identifier: bucketName,
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
