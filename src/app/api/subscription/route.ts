import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

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
      headers: await headers(),
    });

    if (!session?.user) {
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

    // サービスロールキーを使用してRLSをバイパス
    // BetterAuthで認証済みなので、サーバーサイドではサービスロールを使用
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // サブスクリプション情報を取得
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (subError) {
      console.error("Subscription fetch error:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    // 使用量情報を取得
    const { data: usage, error: usageError } = await supabase
      .from("usage")
      .select("messages_count, tokens_used, files_uploaded, storage_bytes")
      .eq("organization_id", organizationId)
      .eq("month", month)
      .maybeSingle();

    if (usageError) {
      console.error("Usage fetch error:", usageError);
      // 使用量のエラーは致命的ではないので続行
    }

    // デフォルト値を設定
    const defaultSubscription = {
      plan: "none" as const,
      status: "active" as const,
      current_period_end: null,
      cancel_at_period_end: false,
    };

    const defaultUsage = {
      messages_count: 0,
      tokens_used: 0,
      files_uploaded: 0,
      storage_bytes: 0,
    };

    return NextResponse.json({
      subscription: subscription || defaultSubscription,
      usage: usage || defaultUsage,
    });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
