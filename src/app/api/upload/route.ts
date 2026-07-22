import { NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/r2";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file object to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Clean and sanitize filename
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const storageKey = `uploads/${uniquePrefix}-${sanitizedOriginalName}`;

    // Store file in R2 or local public/uploads directory fallback
    await uploadToStorage(storageKey, buffer, file.type || "application/octet-stream");

    const urlPath = `/api/files/${storageKey}`;

    return NextResponse.json({
      success: true,
      url: urlPath,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      r2Key: urlPath,
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
