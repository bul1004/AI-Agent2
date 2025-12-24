import { test, expect } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { createTestUser, cleanupTestUser, createOrganization } from "../auth/fixtures";

/**
 * E2Eテスト: サブスクリプションフロー
 *
 * 前提条件:
 * - Stripeテスト環境が設定済み
 * - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_BUSINESS が設定済み
 * - Stripe CLI でWebhook転送中: stripe listen --forward-to localhost:3000/api/stripe/webhook
 *
 * テストケース:
 * 1. 未契約ユーザーが課金ページを閲覧できる
 * 2. Businessプランの詳細が正しく表示される
 * 3. チェックアウトフローが開始できる（Stripeにリダイレクト）
 * 4. 契約中ユーザーがサブスクリプション管理ポータルを開ける
 */

test.describe("サブスクリプション", () => {
  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test("未契約ユーザーが課金ページを閲覧できる", async ({ page }) => {
    // テストユーザーを作成してログイン
    await createTestUser(page);

    // 課金ページに移動
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // 未契約状態であることを確認
    await billingPage.expectNotSubscribed();
  });

  test("Businessプランの詳細が正しく表示される", async ({ page }) => {
    // テストユーザーを作成してログイン
    await createTestUser(page);

    // 課金ページに移動
    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Businessプランの詳細が表示されていることを確認
    await billingPage.expectBusinessPlanDisplayed();
  });

  test("チェックアウトフローが開始できる（Stripeにリダイレクト）", async ({ page }) => {
    // テストユーザーを作成してログイン
    await createTestUser(page);

    // 組織を作成（サブスクリプションは組織単位）
    await createOrganization(page, "テスト組織");

    // 課金ページに移動
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // チェックアウトを開始
    await billingPage.startCheckout();

    // Stripeチェックアウトページにリダイレクトされることを確認
    await billingPage.expectRedirectToStripe();
  });
});

test.describe("サブスクリプション - 契約中", () => {
  // このテストは実際にStripeで支払いを完了した状態が必要
  // Stripe CLIのテストカードを使用: 4242 4242 4242 4242

  test.skip("契約中ユーザーがサブスクリプション管理ポータルを開ける", async ({ page }) => {
    // TODO: 契約済みユーザーのセットアップが必要
    // 実際のテストではStripe Test Clockやfixtures経由でサブスクリプションを作成

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // 契約中状態であることを確認
    await billingPage.expectSubscribed();

    // 管理ポータルを開く
    await billingPage.openManagePortal();

    // Stripeカスタマーポータルにリダイレクトされることを確認
    await billingPage.expectRedirectToStripePortal();
  });
});

test.describe("サブスクリプション - Webhookテスト", () => {
  // Webhookテストは手動で実行することを推奨
  // stripe trigger checkout.session.completed などを使用

  test.skip("チェックアウト完了後にサブスクリプションがアクティブになる", async ({ page }) => {
    // このテストは以下の手順で手動実行:
    // 1. テストユーザーでチェックアウトを完了（テストカード使用）
    // 2. Webhookが処理されるのを待つ
    // 3. 課金ページをリロードして契約中状態を確認

    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectSubscribed();
  });

  test.skip("サブスクリプション解約後に未契約状態に戻る", async ({ page }) => {
    // このテストは以下の手順で手動実行:
    // 1. 契約中ユーザーでStripe管理ポータルからキャンセル
    // 2. 即時キャンセルを選択
    // 3. customer.subscription.deleted Webhookが処理される
    // 4. 課金ページをリロードして未契約状態を確認

    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectNotSubscribed();
  });
});

test.describe("サブスクリプション - エラーハンドリング", () => {
  test("未ログインユーザーは課金ページにアクセスできない", async ({ page }) => {
    // ログインせずに課金ページにアクセス
    await page.goto("/settings/billing");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("組織未選択時はチェックアウトボタンがエラーを表示する", async ({ page }) => {
    // テストユーザーを作成（組織なし）
    await createTestUser(page);

    // 課金ページに移動
    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // チェックアウトを試みる
    await billingPage.startCheckout();

    // エラートーストが表示されることを確認
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
  });
});
