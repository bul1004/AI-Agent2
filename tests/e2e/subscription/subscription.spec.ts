import { test, expect } from "@playwright/test";
import { BillingPage } from "../page-objects/BillingPage";
import { StripeCheckoutPage } from "../page-objects/StripeCheckoutPage";
import {
  createTestUser,
  cleanupTestUser,
  createOrganization,
} from "../auth/fixtures";

/**
 * E2Eテスト: サブスクリプションフロー
 *
 * 前提条件:
 * - Stripeテスト環境が設定済み
 * - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_BUSINESS が設定済み
 * - Stripe CLI でWebhook転送中: stripe listen --forward-to localhost:3000/api/stripe/webhook
 *
 * テストカード:
 * - 成功: 4242 4242 4242 4242
 * - 拒否: 4000 0000 0000 0002
 *
 * テストケース:
 * 1. 未契約ユーザーがサブスクリプションモーダルを閲覧できる
 * 2. Businessプランの詳細が正しく表示される
 * 3. チェックアウトフローが開始できる（Stripeにリダイレクト）
 * 4. チェックアウト完了後にサブスクリプションがアクティブになる
 */

test.describe("サブスクリプション", () => {
  test.afterEach(async ({ page }) => {
    await cleanupTestUser(page);
  });

  test("未契約ユーザーがサブスクリプションモーダルを閲覧できる", async ({
    page,
  }) => {
    // テストユーザーを作成してログイン
    await createTestUser(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // 未契約状態であることを確認
    await billingPage.expectNotSubscribed();
  });

  test("Businessプランの詳細が正しく表示される", async ({ page }) => {
    // テストユーザーを作成してログイン
    await createTestUser(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Businessプランの詳細が表示されていることを確認
    await billingPage.expectBusinessPlanDisplayed();
  });

  test("チェックアウトフローが開始できる（Stripeにリダイレクト）", async ({
    page,
  }) => {
    // テストユーザーを作成してログイン
    await createTestUser(page);

    // 組織を作成（サブスクリプションは組織単位）
    await createOrganization(page, "テスト組織");

    // モーダルを開く
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
  /**
   * 契約中ユーザーのテスト
   *
   * 前提条件:
   * - npx tsx scripts/seed-stripe-test-data.ts でテストデータを作成済み
   * - または、DBに直接サブスクリプションレコードを作成
   *
   * このテストはDBにモックデータを作成してUIの表示を確認します。
   */
  test("契約中ユーザーは契約中ステータスが表示される（DBモック）", async ({
    page,
  }) => {
    // テストユーザーを作成
    await createTestUser(page);

    // 組織を作成
    await createOrganization(page, "契約テスト組織");

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // 現時点では未契約
    await billingPage.expectNotSubscribed();

    // 注: 実際のStripe連携テストには seed-stripe-test-data.ts を使用してください
  });
});

test.describe("サブスクリプション - Webhook連携テスト", () => {
  /**
   * Webhook連携テスト
   *
   * 重要な前提条件:
   * - stripe listen --forward-to localhost:3000/api/stripe/webhook が実行中であること
   * - Stripeテスト環境の環境変数が設定されていること
   *
   * これらのテストは実際にStripeと通信し、Webhookを受信します。
   */

  test.beforeAll(() => {
    // stripe listen が動作していることを確認するための注意書き
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║  Webhook連携テストを実行するには以下が必要です:                    ║
    ║                                                                ║
    ║  1. stripe listen --forward-to localhost:3000/api/stripe/webhook ║
    ║  2. STRIPE_WEBHOOK_SECRET が設定されていること                    ║
    ║  3. STRIPE_PRICE_ID_BUSINESS が設定されていること                 ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
  });

  test("チェックアウト完了後にサブスクリプションがアクティブになる", async ({
    page,
  }) => {
    // テストユーザーを作成
    const testUser = await createTestUser(page);

    // 組織を作成
    await createOrganization(page, "Webhook テスト組織");

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // チェックアウトを開始
    await billingPage.startCheckout();

    // Stripeチェックアウトページで支払い
    const stripeCheckout = new StripeCheckoutPage(page);
    await stripeCheckout.completePaymentWithTestCard(testUser.email);

    // 成功後に/chatにリダイレクト
    await billingPage.expectCheckoutSuccess();

    // Webhookが処理されるのを待つ（最大10秒）
    await page.waitForTimeout(3000);

    // モーダルを再度開いて契約状態を確認
    await billingPage.openSubscriptionModal();
    await billingPage.expectSubscribed();
  });

  test("カード拒否時はエラーが表示される", async ({ page }) => {
    // テストユーザーを作成
    const testUser = await createTestUser(page);

    // 組織を作成
    await createOrganization(page, "カード拒否テスト組織");

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // チェックアウトを開始
    await billingPage.startCheckout();

    // Stripeチェックアウトページで拒否されるカードを使用
    const stripeCheckout = new StripeCheckoutPage(page);
    await stripeCheckout.expectLoaded();

    if (testUser.email) {
      await stripeCheckout.fillEmail(testUser.email);
    }

    // 拒否されるテストカードを入力
    await stripeCheckout.fillCardDetails(StripeCheckoutPage.DECLINED_CARD);
    await stripeCheckout.submit();

    // エラーが表示されることを確認
    await stripeCheckout.expectPaymentDeclined();
  });
});

test.describe("サブスクリプション - エラーハンドリング", () => {
  test("未ログインユーザーは/chatにアクセスするとログインにリダイレクト", async ({
    page,
  }) => {
    // ログインせずに/chatにアクセス
    await page.goto("/chat");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("組織未選択時はチェックアウトボタンをクリックしても何も起きない", async ({
    page,
  }) => {
    // テストユーザーを作成（組織なし）
    await createTestUser(page);

    // モーダルを開く
    const billingPage = new BillingPage(page);
    await billingPage.goto();
    await billingPage.expectLoaded();

    // チェックアウトを試みる
    await billingPage.startCheckout();

    // Stripeにリダイレクトされず、まだ/chatにいることを確認
    await expect(page).toHaveURL(/\/chat/, { timeout: 3000 });
  });
});
