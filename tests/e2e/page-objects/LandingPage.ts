import { expect, type Locator, type Page } from "@playwright/test";

/**
 * ランディングページのPage Object
 * ルート（/）にあるランディングページを操作するためのクラス
 */
export class LandingPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly signupButton: Locator;
  readonly loginButton: Locator;
  readonly chatInput: Locator;
  readonly signupModal: Locator;
  readonly modalSignupButton: Locator;
  readonly modalLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // ヘッダーのロゴ/タイトル
    this.heading = page.getByText("AI Assistant").first();
    // ヘッダーのサインアップボタン（"無料で始める"）
    this.signupButton = page.getByRole("button", { name: "無料で始める" });
    // ヘッダーのログインボタン
    this.loginButton = page.getByRole("button", { name: "ログイン" });
    // チャット入力フィールド
    this.chatInput = page.getByPlaceholder("AIに何でも聞いてみてください...");
    // サインアップモーダル
    this.signupModal = page.locator(".fixed.inset-0.z-50");
    // モーダル内のメールで登録ボタン
    this.modalSignupButton = page.getByRole("button", { name: "メールで登録" });
    // モーダル内のログインボタン
    this.modalLoginButton = page.getByRole("button", {
      name: "すでにアカウントをお持ちの方",
    });
  }

  /**
   * ランディングページに移動
   */
  async goto() {
    await this.page.goto("/");
    await this.expectLoaded();
  }

  /**
   * ページが正常にロードされたことを確認
   */
  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
    await expect(this.signupButton).toBeVisible();
  }

  /**
   * ヘッダーのサインアップボタンをクリック
   */
  async clickSignupButton() {
    await this.signupButton.click();
  }

  /**
   * ヘッダーのログインボタンをクリック
   */
  async clickLoginButton() {
    await this.loginButton.click();
  }

  /**
   * チャット入力フィールドをフォーカスしてモーダルを開く
   */
  async focusChatInput() {
    await this.chatInput.click();
    await expect(this.signupModal).toBeVisible();
  }

  /**
   * モーダルが表示されていることを確認
   */
  async expectModalVisible() {
    await expect(this.signupModal).toBeVisible();
    await expect(this.modalSignupButton).toBeVisible();
  }

  /**
   * モーダル内のメールで登録ボタンをクリック
   */
  async clickModalSignupButton() {
    await this.modalSignupButton.click();
  }
}
