import { test } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { loginAsUser, switchToOrganization } from "./fixtures";

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
 */

test.describe("メンバー権限でのサブスクリプション制限", () => {
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
