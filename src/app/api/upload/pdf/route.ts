import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { uploadToR2, getR2Key } from "@/lib/server/cloudflare/r2";
import { createSupabaseServerClient } from "@/lib/db/server";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;

    if (!file || !organizationId) {
      return NextResponse.json(
        { error: "Missing file or organizationId" },
        { status: 400 }
      );
    }

    // File size check (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max 50MB" },
        { status: 400 }
      );
    }

    // Upload to R2
    const fileId = nanoid();
    const key = getR2Key(organizationId, "pdf", `${fileId}.pdf`);
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2(key, buffer, "application/pdf");

    // Save to database
    const supabase = await createSupabaseServerClient();
    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        organization_id: organizationId,
        title: file.name,
        file_url: url,
        file_type: "pdf",
        created_by: session.user.id,
        metadata: {
          originalName: file.name,
          size: file.size,
          r2Key: key,
        },
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
