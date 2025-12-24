/**
 * Stripe E2Eテスト用シードスクリプト
 *
 * このスクリプトはStripe開発環境に以下を作成します:
 * - テスト用Customer
 * - テスト用Subscription（Businessプラン）
 * - SupabaseのDBにも対応するレコードを作成
 *
 * 使用方法:
 *   npx tsx scripts/seed-stripe-test-data.ts
 *
 * 前提条件:
 *   - STRIPE_SECRET_KEY が設定されていること
 *   - STRIPE_PRICE_ID_BUSINESS が設定されていること
 *   - Supabase接続情報が設定されていること
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

// Load environment variables
loadEnvConfig(process.cwd());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// テストユーザー設定（.env.localから読み込み）
const TEST_CONFIG = {
  email: process.env.E2E_STRIPE_TEST_EMAIL || "e2e-stripe-test@example.com",
  name: process.env.E2E_STRIPE_TEST_NAME || "E2E Stripe Test User",
  password: process.env.E2E_TEST_PASSWORD || "E2eTestPassword123!",
  orgName: process.env.E2E_STRIPE_TEST_ORG || "E2E Stripe Test Org",
};

interface SeedResult {
  userId: string;
  organizationId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

async function findOrCreateUser(): Promise<{ id: string; isNew: boolean }> {
  // 既存ユーザーを検索
  const { data: existingUser } = await supabase
    .from("user")
    .select("id")
    .eq("email", TEST_CONFIG.email)
    .single();

  if (existingUser) {
    console.log(`✓ 既存ユーザーを使用: ${TEST_CONFIG.email}`);
    return { id: existingUser.id, isNew: false };
  }

  // BetterAuth経由でユーザーを作成するのは複雑なので、
  // 既存ユーザーがない場合はエラーにする
  throw new Error(
    `テストユーザーが存在しません: ${TEST_CONFIG.email}\n` +
      `先に以下のコマンドでユーザーを作成してください:\n` +
      `  1. npm run dev\n` +
      `  2. /signup でユーザー登録\n` +
      `  3. このスクリプトを再実行`,
  );
}

async function findOrCreateOrganization(userId: string): Promise<string> {
  // ユーザーがオーナーの組織を検索
  const { data: existingMember } = await supabase
    .from("member")
    .select("organizationId, organization:organization(id, name)")
    .eq("userId", userId)
    .eq("role", "owner")
    .single();

  if (existingMember?.organizationId) {
    const org = existingMember.organization as unknown as {
      name: string;
    } | null;
    console.log(
      `✓ 既存組織を使用: ${org?.name || existingMember.organizationId}`,
    );
    return existingMember.organizationId;
  }

  // 組織を新規作成
  const orgId = crypto.randomUUID();
  const slug = `e2e-stripe-test-${Date.now()}`;

  const { error: orgError } = await supabase.from("organization").insert({
    id: orgId,
    name: TEST_CONFIG.orgName,
    slug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (orgError) {
    throw new Error(`組織作成エラー: ${orgError.message}`);
  }

  // メンバーシップを作成
  const { error: memberError } = await supabase.from("member").insert({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId,
    role: "owner",
    createdAt: new Date().toISOString(),
  });

  if (memberError) {
    throw new Error(`メンバー作成エラー: ${memberError.message}`);
  }

  console.log(`✓ 組織を作成: ${TEST_CONFIG.orgName}`);
  return orgId;
}

async function findOrCreateStripeCustomer(
  organizationId: string,
  email: string,
): Promise<string> {
  // 既存のサブスクリプションを確認
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .single();

  if (existingSub?.stripe_customer_id) {
    // Stripeでも存在確認
    try {
      const customer = await stripe.customers.retrieve(
        existingSub.stripe_customer_id,
      );
      if (!customer.deleted) {
        console.log(
          `✓ 既存Stripe Customerを使用: ${existingSub.stripe_customer_id}`,
        );
        return existingSub.stripe_customer_id;
      }
    } catch {
      // 存在しない場合は新規作成
    }
  }

  // Stripe Customerを新規作成
  const customer = await stripe.customers.create({
    email,
    name: TEST_CONFIG.name,
    metadata: {
      organizationId,
      environment: "e2e-test",
    },
  });

  console.log(`✓ Stripe Customerを作成: ${customer.id}`);
  return customer.id;
}

async function createStripeSubscription(customerId: string): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID_BUSINESS;
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID_BUSINESS が設定されていません");
  }

  // 既存のアクティブなサブスクリプションを確認
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (existingSubs.data.length > 0) {
    console.log(`✓ 既存Subscriptionを使用: ${existingSubs.data[0].id}`);
    return existingSubs.data[0].id;
  }

  // テストクロックを使わずに直接サブスクリプション作成（テストモード）
  // テストモードでは支払い方法なしでもサブスクリプションを作成可能
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  });

  // テスト用にサブスクリプションを即座にアクティブにする
  // 本来はPayment Intentの確認が必要だが、テスト環境では省略可能
  const updatedSub = await stripe.subscriptions.update(subscription.id, {
    // テストモードでトライアル終了日を過去に設定してアクティブ化
    trial_end: "now",
  });

  console.log(`✓ Stripe Subscriptionを作成: ${updatedSub.id}`);
  return updatedSub.id;
}

async function syncToDatabase(
  organizationId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
): Promise<void> {
  // Stripeからサブスクリプション情報を取得
  const subscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Stripe APIレスポンスから期間情報を取得（型アサーション）
  const subData = subscription as unknown as {
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };

  const { error } = await supabase.from("subscriptions").upsert({
    id: `stripe-${stripeSubscriptionId}`,
    organization_id: organizationId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    plan: "business",
    status: subData.status as
      | "active"
      | "canceled"
      | "past_due"
      | "trialing"
      | "unpaid",
    current_period_start: new Date(
      subData.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(
      subData.current_period_end * 1000,
    ).toISOString(),
    cancel_at_period_end: subData.cancel_at_period_end,
  });

  if (error) {
    throw new Error(`DB同期エラー: ${error.message}`);
  }

  console.log(`✓ DBにサブスクリプション情報を同期`);
}

async function main(): Promise<SeedResult> {
  console.log("=== Stripe E2Eテスト用シード開始 ===\n");

  // 1. ユーザー確認/作成
  const { id: userId } = await findOrCreateUser();

  // 2. 組織確認/作成
  const organizationId = await findOrCreateOrganization(userId);

  // 3. Stripe Customer確認/作成
  const stripeCustomerId = await findOrCreateStripeCustomer(
    organizationId,
    TEST_CONFIG.email,
  );

  // 4. Stripe Subscription作成
  const stripeSubscriptionId = await createStripeSubscription(stripeCustomerId);

  // 5. DBに同期
  await syncToDatabase(organizationId, stripeCustomerId, stripeSubscriptionId);

  const result: SeedResult = {
    userId,
    organizationId,
    stripeCustomerId,
    stripeSubscriptionId,
  };

  console.log("\n=== シード完了 ===");
  console.log(JSON.stringify(result, null, 2));

  // 環境変数の推奨設定を出力
  console.log("\n以下を .env.local に追加してください:");
  console.log(`E2E_STRIPE_TEST_EMAIL=${TEST_CONFIG.email}`);
  console.log(`E2E_STRIPE_TEST_ORG_ID=${organizationId}`);
  console.log(`E2E_STRIPE_CUSTOMER_ID=${stripeCustomerId}`);
  console.log(`E2E_STRIPE_SUBSCRIPTION_ID=${stripeSubscriptionId}`);

  return result;
}

main().catch((error) => {
  console.error("エラー:", error.message);
  process.exit(1);
});
