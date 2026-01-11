import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-token";
import { createLogger, serializeError } from "@/lib/server/logging/logger";

const logger = createLogger("api.chat.messages");

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
      name: "api.chat.messages.token",
      err: serializeError(error),
    });
  }
  if (!supabaseToken) {
    return { session: null, supabase: null };
  }
  const supabase = await createSupabaseServerClient(supabaseToken);
  return { session, supabase };
}

export async function GET(
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
      name: "api.chat.messages.thread",
      err: serializeError(threadError),
    });
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, metadata, createdAt")
    .eq("threadId", threadId)
    .order("createdAt", { ascending: true });

  if (error) {
    logger.error("Failed to fetch chat messages", {
      name: "api.chat.messages.fetch",
      err: serializeError(error),
    });
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}
