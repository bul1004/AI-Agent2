import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudflareImages } from "@/lib/cloudflare/images";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // File size check (10MB limit for images)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 10MB" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Upload to Cloudflare Images
    const result = await uploadToCloudflareImages(file, {
      organizationId: organizationId || "",
      userId: session.user.id,
      originalName: file.name,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      url: result.url,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
