import { test, expect } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { createTestUser, cleanupTestUser } from "../auth/fixtures";

/**
 * E2Eテスト: 個人モードでのサブスクリプション
 *
 * テスト観点:
 * - 個人（組織なし）で課金できる
 * - 個人プラン用の表示がされる
 * - Stripeチェックアウトにリダイレクトされる
 */

test.describe("個人モードでのサブスクリプション", () => {
  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test("個人モードでプラン詳細が正しく表示される", async ({ page }) => {
    // 新規ユーザーを作成（組織なし = 個人モード）
    await createTestUser(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // 個人モードの表示を確認
    await billingPage.expectPersonalMode();
    await billingPage.expectBusinessPlanDisplayed();
  });

  test("個人モードでStripeチェックアウトにリダイレクトされる", async ({
    page,
  }) => {
    // 新規ユーザーを作成（組織なし = 個人モード）
    await createTestUser(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // 個人モードの表示を確認
    await billingPage.expectPersonalMode();

    // チェックアウトを開始
    await billingPage.startCheckout();

    // Stripeにリダイレクトされることを確認
    await billingPage.expectRedirectToStripe();
  });
});

