import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/db/server";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-token";
import { createLogger, serializeError } from "@/lib/server/logging/logger";

const logger = createLogger("api.subscription");

/**
 * GET /api/subscription
 * 現在のユーザー/組織のサブスクリプション情報を取得
 *
 * クエリパラメータ:
 * - organizationId: 組織ID（必須）
 * - month: 使用量の月（オプション、YYYY-MM-01形式）
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let supabaseToken: string | null = null;
    try {
      supabaseToken = await createSupabaseAccessToken(session);
    } catch (error) {
      logger.warn("Failed to create Supabase token", {
        name: "api.subscription.token",
        err: serializeError(error),
      });
    }
    if (!supabaseToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7) + "-01";

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // RLS経由で認可するため、BetterAuthのJWTを付与
    const supabase = await createSupabaseServerClient(supabaseToken);

    // サブスクリプション情報を取得
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, status, currentPeriodEnd, cancelAtPeriodEnd")
      .eq("organizationId", organizationId)
      .maybeSingle();

    if (subError) {
      logger.error("Subscription fetch error", {
        name: "api.subscription.fetch",
        err: serializeError(subError),
      });
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    // 使用量情報を取得
    const { data: usage, error: usageError } = await supabase
      .from("usage")
      .select("messagesCount, tokensUsed, filesUploaded, storageBytes")
      .eq("organizationId", organizationId)
      .eq("month", month)
      .maybeSingle();

    if (usageError) {
      logger.warn("Usage fetch error", {
        name: "api.subscription.usage",
        err: serializeError(usageError),
      });
      // 使用量のエラーは致命的ではないので続行
    }

    // デフォルト値を設定
    const defaultSubscription = {
      plan: "none" as const,
      status: "active" as const,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    const defaultUsage = {
      messagesCount: 0,
      tokensUsed: 0,
      filesUploaded: 0,
      storageBytes: 0,
    };

    return NextResponse.json({
      subscription: subscription || defaultSubscription,
      usage: usage || defaultUsage,
    });
  } catch (error) {
    logger.error("Subscription API error", {
      name: "api.subscription.unhandled",
      err: serializeError(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
