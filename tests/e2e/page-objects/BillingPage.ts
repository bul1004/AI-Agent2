import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * サブスクリプションモーダルのPage Object
 * プロフィールメニューからSubscriptionModalを開いてテスト
 */
export class BillingPage {
  readonly page: Page;
  readonly profileButton: Locator;
  readonly upgradeButton: Locator;
  readonly subscribeButton: Locator;
  readonly manageButton: Locator;
  readonly planName: Locator;
  readonly planPrice: Locator;
  readonly modalContent: Locator;

  constructor(page: Page) {
    this.page = page;
    // プロフィールメニューのボタン
    this.profileButton = page.getByTestId("profile-avatar-button");
    // プロフィールメニュー内のアップグレードボタン
    this.upgradeButton = page.getByRole("button", { name: "アップグレード" });
    // モーダル内の購読ボタン
    this.subscribeButton = page.getByRole("button", { name: "今すぐ始める" });
    // 契約中の場合のボタン
    this.manageButton = page.getByRole("button", { name: "契約中" });
    // プラン情報
    this.planName = page.locator("h3").filter({ hasText: "Business" });
    this.planPrice = page.locator("text=¥9,800");
    // モーダルのコンテンツ
    this.modalContent = page.locator('[role="dialog"]');
  }

  /**
   * /chat に移動してからモーダルを開く
   */
  async goto() {
    await this.page.goto("/chat");
    await this.page.waitForLoadState("networkidle");
    await this.openSubscriptionModal();
  }

  /**
   * プロフィールメニューからサブスクリプションモーダルを開く
   */
  async openSubscriptionModal() {
    await this.profileButton.click();
    await this.upgradeButton.click();
    await this.page.waitForTimeout(500); // モーダルのアニメーション待ち
  }

  /**
   * モーダルが読み込まれたことを確認
   */
  async expectLoaded() {
    await expect(this.modalContent).toBeVisible({ timeout: 10000 });
    await expect(
      this.page.locator("h2").filter({ hasText: "プランをアップグレード" }),
    ).toBeVisible();
  }

  /**
   * 未契約状態であることを確認
   */
  async expectNotSubscribed() {
    // 「今すぐ始める」ボタンが表示されている
    await expect(this.subscribeButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * 契約中状態であることを確認
   */
  async expectSubscribed() {
    // 「契約中」ボタンが表示されている
    await expect(this.manageButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Businessプランの詳細が表示されていることを確認
   */
  async expectBusinessPlanDisplayed() {
    // プラン名
    await expect(this.planName).toBeVisible({ timeout: 10000 });
    // 価格
    await expect(this.planPrice).toBeVisible();
    // 特徴リスト
    await expect(this.page.locator("text=30日間返金保証")).toBeVisible();
  }

  /**
   * チェックアウトを開始（Stripeにリダイレクト）
   */
  async startCheckout() {
    await this.subscribeButton.click();
  }

  /**
   * Stripeチェックアウトページにリダイレクトされることを確認
   */
  async expectRedirectToStripe() {
    // Stripeのcheckout URLにリダイレクトされるのを待つ
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
  }

  /**
   * Stripeカスタマーポータルにリダイレクトされることを確認
   */
  async expectRedirectToStripePortal() {
    await this.page.waitForURL(/billing\.stripe\.com/, { timeout: 30000 });
  }

  /**
   * 成功後に/chatにリダイレクトされることを確認
   */
  async expectCheckoutSuccess() {
    await expect(this.page).toHaveURL(/\/chat/, { timeout: 10000 });
  }

  /**
   * キャンセル後に/chatにリダイレクトされることを確認
   */
  async expectCheckoutCanceled() {
    await expect(this.page).toHaveURL(/\/chat/, { timeout: 10000 });
  }
}
