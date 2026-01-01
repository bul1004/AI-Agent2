import { test } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { loginAsUser, switchToOrganization, TEST_ORG } from "./fixtures";
import { cleanupTestSubscription, setTestSubscription } from "../auth/fixtures";
import { createClient } from "@supabase/supabase-js";

/**
 * E2Eテスト: メンバー権限でのサブスクリプション制限
 *
 * テスト観点:
 * - メンバー権限ではサブスクボタンがグレーアウトされる
 * - 「管理者に連絡してください」メッセージが表示される
 * - ボタンをクリックしても何も起きない
 *
 * 使用するシードデータ:
 * - e2e-member@example.com (member権限)
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

test.describe("メンバー権限でのサブスクリプション制限", () => {
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
  test("メンバー権限ではサブスクボタンがグレーアウトされる", async ({
    page,
  }) => {
    // メンバーでログイン
    await loginAsUser(page, "member");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // メンバー権限の制限を確認
    await billingPage.expectMemberRestricted();
  });

  test("メンバー権限でもプラン詳細は閲覧できる", async ({ page }) => {
    // メンバーでログイン
    await loginAsUser(page, "member");

    // 組織モードに切り替え
    await switchToOrganization(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.openSubscriptionModal();
    await billingPage.expectLoaded();

    // プラン詳細は表示される
    await billingPage.expectBusinessPlanDisplayed();
  });
});
