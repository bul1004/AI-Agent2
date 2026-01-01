import { test } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { loginAsUser, switchToOrganization, TEST_ORG } from "./fixtures";
import { cleanupTestSubscription, setTestSubscription } from "../auth/fixtures";
import { createClient } from "@supabase/supabase-js";

/**
 * E2Eテスト: チームモードでのサブスクリプション（オーナー/管理者）
 *
 * テスト観点:
 * - オーナー権限で組織単位の課金ができる
 * - 管理者権限で組織単位の課金ができる
 * - チームプラン用の表示がされる
 * - Stripeチェックアウトにリダイレクトされる
 *
 * 使用するシードデータ:
 * - e2e-owner@example.com (owner権限)
 * - e2e-admin@example.com (admin権限)
 *
 * 注意: シードデータにはサブスクリプションが含まれているため、
 *       テスト前に削除し、テスト後に復元します
 */

// テスト用の組織IDを取得
async function getTestOrgId(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data } = await supabase
    .from("organization")
    .select("id")
    .eq("slug", TEST_ORG.slug)
    .single();

  return data?.id ?? null;
}

test.describe("チームモードでのサブスクリプション", () => {
  let orgId: string | null = null;

  // テスト前にサブスクリプションを削除
  test.beforeAll(async () => {
    orgId = await getTestOrgId();
    if (orgId) {
      await cleanupTestSubscription(orgId);
    }
  });

  // テスト後にサブスクリプションを復元
  test.afterAll(async () => {
    if (orgId) {
      await setTestSubscription(orgId, "business", "active");
    }
  });
  test("オーナー権限でプラン詳細が正しく表示される", async ({ page }) => {
    // オーナーでログイン
    await loginAsUser(page, "owner");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // チームモードの表示を確認
    await billingPage.expectTeamMode();
    await billingPage.expectBusinessPlanDisplayed();
    await billingPage.expectNotSubscribed();
  });

  test("管理者権限でプラン詳細が正しく表示される", async ({ page }) => {
    // 管理者でログイン
    await loginAsUser(page, "admin");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // チームモードの表示を確認
    await billingPage.expectTeamMode();
    await billingPage.expectBusinessPlanDisplayed();
    await billingPage.expectNotSubscribed();
  });

  test("オーナー権限でStripeチェックアウトにリダイレクトされる", async ({
    page,
  }) => {
    // オーナーでログイン
    await loginAsUser(page, "owner");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // チェックアウトを開始
    await billingPage.startCheckout();

    // Stripeにリダイレクトされることを確認
    await billingPage.expectRedirectToStripe();
  });
});
