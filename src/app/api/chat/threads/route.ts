import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-token";
import { createLogger, serializeError } from "@/lib/server/logging/logger";
import {
  ensurePersonalOrganizationExists,
  ensureUserRecordExists,
} from "@/lib/server/chat/ensure-personal-org";

const logger = createLogger("api.chat.threads");

const getActiveOrganizationId = (
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>,
) => {
  const activeOrgId = (session.session as Record<string, unknown> | null)
    ?.activeOrganizationId as string | null | undefined;
  return activeOrgId ?? session.user.id;
};

async function getSupabaseWithSession(headersList: Headers) {
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user) {
    return { session: null, supabase: null, activeOrganizationId: null };
  }
  let supabaseToken: string | null = null;
  try {
    supabaseToken = await createSupabaseAccessToken(session);
  } catch (error) {
    logger.warn("Failed to create Supabase token", {
      name: "api.chat.threads.token",
      err: serializeError(error),
    });
  }
  if (!supabaseToken) {
    return { session: null, supabase: null, activeOrganizationId: null };
  }
  const supabase = await createSupabaseServerClient(supabaseToken);
  const activeOrganizationId = getActiveOrganizationId(session);
  return { session, supabase, activeOrganizationId };
}

export async function GET(request: Request) {
  const { session, supabase, activeOrganizationId } =
    await getSupabaseWithSession(request.headers);
  if (!session || !supabase || !activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("chat_threads")
    .select("id, title, createdAt, updatedAt")
    .eq("organizationId", activeOrganizationId)
    .order("updatedAt", { ascending: false })
    .order("createdAt", { ascending: false });

  if (error) {
    logger.error("Failed to fetch chat threads", {
      name: "api.chat.threads.fetch",
      err: serializeError(error),
    });
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }

  return NextResponse.json({ threads: data ?? [] });
}

export async function POST(request: Request) {
  const { session, supabase, activeOrganizationId } =
    await getSupabaseWithSession(request.headers);
  if (!session || !supabase || !activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threadId = nanoid();
  try {
    await ensureUserRecordExists(session.user);
    await ensurePersonalOrganizationExists(activeOrganizationId, session.user);
  } catch (error) {
    logger.error("Failed to prepare personal org", {
      name: "api.chat.threads.ensurePersonalOrg",
      err: serializeError(error),
    });
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 },
    );
  }
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      id: threadId,
      organizationId: activeOrganizationId,
      userId: session.user.id,
      title: null,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to create chat thread", {
      name: "api.chat.threads.create",
      err: serializeError(error),
    });
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }

  return NextResponse.json({ threadId: data?.id ?? threadId });
}
