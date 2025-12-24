import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * 課金・サブスクリプションページのPage Object
 */
export class BillingPage {
  readonly page: Page;
  readonly subscriptionStatus: Locator;
  readonly pricingCard: Locator;
  readonly subscribeButton: Locator;
  readonly manageButton: Locator;
  readonly planName: Locator;
  readonly planPrice: Locator;
  readonly featuresList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.subscriptionStatus = page.locator('[data-testid="subscription-status"]');
    this.pricingCard = page.locator('[data-testid="pricing-card"]');
    this.subscribeButton = page.getByRole("button", { name: "今すぐ始める" });
    this.manageButton = page.getByRole("button", { name: "サブスクリプションを管理" });
    this.planName = page.locator("h3").filter({ hasText: "Business" });
    this.planPrice = page.locator("text=¥9,800");
    this.featuresList = page.locator("ul li");
  }

  async goto() {
    await this.page.goto("/settings/billing");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * ページが読み込まれたことを確認
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/settings\/billing/);
  }

  /**
   * 未契約状態であることを確認
   */
  async expectNotSubscribed() {
    // 「今すぐ始める」ボタンが表示されている
    await expect(this.subscribeButton).toBeVisible({ timeout: 10000 });
    // 「サブスクリプションを管理」ボタンが表示されていない
    await expect(this.manageButton).not.toBeVisible();
  }

  /**
   * 契約中状態であることを確認
   */
  async expectSubscribed() {
    // 「サブスクリプションを管理」ボタンが表示されている
    await expect(this.manageButton).toBeVisible({ timeout: 10000 });
    // 「契約中」バッジが表示されている
    await expect(this.page.locator("text=契約中")).toBeVisible();
  }

  /**
   * Businessプランの詳細が表示されていることを確認
   */
  async expectBusinessPlanDisplayed() {
    // プラン名
    await expect(this.planName).toBeVisible({ timeout: 10000 });
    // 価格
    await expect(this.planPrice).toBeVisible();
    // 特徴リスト（6項目）
    await expect(this.page.locator("text=REINS PDF OCR")).toBeVisible();
    await expect(this.page.locator("text=顧客条件とのマッチング")).toBeVisible();
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
   * サブスクリプション管理ポータルを開く
   */
  async openManagePortal() {
    await this.manageButton.click();
  }

  /**
   * Stripeカスタマーポータルにリダイレクトされることを確認
   */
  async expectRedirectToStripePortal() {
    await this.page.waitForURL(/billing\.stripe\.com/, { timeout: 30000 });
  }

  /**
   * 成功メッセージが表示されることを確認（チェックアウト完了後）
   */
  async expectCheckoutSuccess() {
    await expect(this.page).toHaveURL(/\?success=true/);
  }

  /**
   * キャンセルメッセージが表示されることを確認
   */
  async expectCheckoutCanceled() {
    await expect(this.page).toHaveURL(/\?canceled=true/);
  }
}
