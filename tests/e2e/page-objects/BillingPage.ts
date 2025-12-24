import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * サブスクリプションモーダルのPage Object
 * プロフィールメニューからSubscriptionModalを開いてテスト
 */
export class BillingPage {
  readonly page: Page;
  readonly modalContent: Locator;
  readonly modalTitle: Locator;
  readonly planName: Locator;
  readonly planPrice: Locator;

  constructor(page: Page) {
    this.page = page;

    // モーダル
    this.modalContent = page.locator('[role="dialog"]');
    this.modalTitle = page
      .locator('[role="dialog"] h2')
      .filter({ hasText: "プランをアップグレード" });

    // プラン情報
    this.planName = page.locator("h3").filter({ hasText: "Business" });
    this.planPrice = page.locator('[role="dialog"]').locator("text=¥9,800");
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
    // サイドバーのプロフィールボタン（最後のボタン）をクリック
    const profileBtn = this.page.locator("aside button").last();
    await profileBtn.waitFor({ state: "visible", timeout: 10000 });
    await profileBtn.click();

    // メニュー内の「プランをアップグレード」をクリック
    const upgradeMenuItem = this.page.getByRole("menuitem", {
      name: /プランをアップグレード/,
    });
    await upgradeMenuItem.waitFor({ state: "visible", timeout: 5000 });
    await upgradeMenuItem.click();

    // モーダルが開くのを待つ
    await this.modalContent.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * モーダルが読み込まれたことを確認
   */
  async expectLoaded() {
    await expect(this.modalContent).toBeVisible({ timeout: 10000 });
    await expect(this.modalTitle).toBeVisible();
  }

  /**
   * 個人モードの表示を確認
   */
  async expectPersonalMode() {
    // 「/月」のみ（「/シート/月」ではない）
    await expect(
      this.page.locator('[role="dialog"]').getByText("/月", { exact: true }),
    ).toBeVisible({ timeout: 5000 });
    // 個人事業主向けプラン
    await expect(
      this.page.locator('[role="dialog"]').getByText("個人事業主向けプラン"),
    ).toBeVisible();
    // 個人プランを始めるボタン
    await expect(
      this.page.getByRole("button", { name: "個人プランを始める" }),
    ).toBeVisible();
  }

  /**
   * チームモードの表示を確認
   */
  async expectTeamMode() {
    // 「/シート/月」の表示
    await expect(
      this.page.locator('[role="dialog"]').getByText("/シート/月"),
    ).toBeVisible({ timeout: 5000 });
    // チームプランを始めるボタン
    await expect(
      this.page.getByRole("button", { name: "チームプランを始める" }),
    ).toBeVisible();
  }

  /**
   * 未契約状態で購読ボタンが有効であることを確認
   */
  async expectNotSubscribed() {
    const subscribeButton = this.page
      .locator('[role="dialog"] button')
      .filter({
        hasText: /個人プランを始める|チームプランを始める|今すぐ始める/,
      });
    await expect(subscribeButton).toBeVisible({ timeout: 10000 });
    await expect(subscribeButton).toBeEnabled();
  }

  /**
   * 契約中状態であることを確認
   */
  async expectSubscribed() {
    await expect(
      this.page.getByRole("button", { name: "契約中" }),
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * メンバー権限でボタンがグレーアウトされていることを確認
   */
  async expectMemberRestricted() {
    // 警告メッセージが表示されている
    await expect(
      this.page.getByText(
        "サブスクリプションの管理は管理者またはオーナーのみが行えます",
      ),
    ).toBeVisible({ timeout: 10000 });

    // ボタンが「管理者に連絡してください」で無効化されている
    const adminContactButton = this.page.getByRole("button", {
      name: "管理者に連絡してください",
    });
    await expect(adminContactButton).toBeVisible();
    await expect(adminContactButton).toBeDisabled();
  }

  /**
   * Businessプランの詳細が表示されていることを確認
   */
  async expectBusinessPlanDisplayed() {
    await expect(this.planName).toBeVisible({ timeout: 10000 });
    await expect(this.planPrice).toBeVisible();
    await expect(
      this.page.locator('[role="dialog"]').getByText("30日間返金保証"),
    ).toBeVisible();
  }

  /**
   * チェックアウトを開始（Stripeにリダイレクト）
   */
  async startCheckout() {
    const subscribeButton = this.page
      .locator('[role="dialog"] button')
      .filter({
        hasText: /個人プランを始める|チームプランを始める|今すぐ始める/,
      });
    await subscribeButton.click();
  }

  /**
   * Stripeチェックアウトページにリダイレクトされることを確認
   */
  async expectRedirectToStripe() {
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
  }

  /**
   * Stripeカスタマーポータルにリダイレクトされることを確認
   */
  async expectRedirectToStripePortal() {
    await this.page.waitForURL(/billing\.stripe\.com/, { timeout: 30000 });
  }
}
