import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-token";
import { createLogger, serializeError } from "@/lib/server/logging/logger";

const logger = createLogger("api.chat.thread");

async function getSupabaseWithSession(headersList: Headers) {
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user) {
    return { session: null, supabase: null };
  }
  let supabaseToken: string | null = null;
  try {
    supabaseToken = await createSupabaseAccessToken(session);
  } catch (error) {
    logger.warn("Failed to create Supabase token", {
      name: "api.chat.thread.token",
      err: serializeError(error),
    });
  }
  if (!supabaseToken) {
    return { session: null, supabase: null };
  }
  const supabase = await createSupabaseServerClient(supabaseToken);
  return { session, supabase };
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const { session, supabase } = await getSupabaseWithSession(request.headers);
  if (!session || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) {
    logger.error("Failed to fetch chat thread", {
      name: "api.chat.thread.fetch",
      err: serializeError(threadError),
    });
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("chat_threads")
    .delete()
    .eq("id", threadId);

  if (error) {
    logger.error("Failed to delete chat thread", {
      name: "api.chat.thread.delete",
      err: serializeError(error),
    });
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await params;
  const { session, supabase } = await getSupabaseWithSession(request.headers);
  if (!session || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string };
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) {
    logger.error("Failed to fetch chat thread", {
      name: "api.chat.thread.fetch",
      err: serializeError(threadError),
    });
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("chat_threads")
    .update({ title })
    .eq("id", threadId);

  if (error) {
    logger.error("Failed to rename chat thread", {
      name: "api.chat.thread.rename",
      err: serializeError(error),
    });
    return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
